"""
WebSocket handler for AI Avatar Interaction.
"""

import json
import uuid
import base64

from fastapi import WebSocket
from session import Session
from stt import transcribe_audio
from llm import stream_completion
from tts import stream_tts

async def handle_websocket(ws: WebSocket) -> None:
    await ws.accept()
    session = Session(session_id=str(uuid.uuid4()))

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            msg_type = data.get("type")

            if msg_type == "audio":
                payload = data.get("payload")
                if not payload:
                    continue

                session.append_audio(base64.b64decode(payload))

            elif msg_type == "audio_end":
                full_audio = session.consume_audio()

                if not full_audio:
                    await ws.send_json({"type": "status", "payload": "ready"})
                    continue

                await process_audio_to_voice(ws, session, full_audio)

            elif msg_type == "ping":
                await ws.send_json({"type": "pong"})

    except Exception as e:
        try:
            await ws.send_json({"type": "error", "payload": str(e)})
        except Exception:
            pass



async def process_audio_to_voice(
    ws: WebSocket,
    session: Session,
    audio_bytes: bytes,
) -> None:
    """STT → LLM → TTS pipeline"""

    await ws.send_json({"type": "status", "payload": "transcribing"})

    text = await transcribe_audio(audio_bytes)
    print("STT TEXT:", text)

    if not text or text.startswith("["):
        await ws.send_json({"type": "status", "payload": "ready"})
        return

    session.add_user_message(text)
    await ws.send_json({"type": "user_text", "payload": text})

    await ws.send_json({"type": "status", "payload": "thinking"})

    response = ""
    async for token in stream_completion(session.get_llm_messages()):
        response += token
        await ws.send_json({"type": "llm_token", "payload": token})

    if not response:
        await ws.send_json({"type": "status", "payload": "ready"})
        return

    session.add_assistant_message(response)
    await ws.send_json({"type": "assistant_text", "payload": response})

    await ws.send_json({"type": "status", "payload": "speaking"})

    audio_chunks = []
    async for chunk in stream_tts(response):
        if chunk:
            audio_chunks.append(chunk)

    if audio_chunks:
        audio = b"".join(audio_chunks)
        b64 = base64.b64encode(audio).decode("utf-8")
        await ws.send_json({"type": "audio", "payload": b64})

    await ws.send_json({"type": "status", "payload": "ready"})
