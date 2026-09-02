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
    packet_count = 0

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            msg_type = data.get("type")

            if msg_type == "init_session":
                resume_text = data.get("resume_text", "")
                job_role = data.get("job_role", "")
                interview_type = data.get("interview_type", "general")
                interviewer_tone = data.get("interviewer_tone", "professional")
                session.set_interview_context(resume_text, job_role, interview_type, interviewer_tone)

                role_str = f"the {job_role.strip()}" if job_role.strip() else "your"
                greeting_text = (
                    f"Hello! Welcome to your mock interview session for {role_str} role. "
                    "I have reviewed your details. When you're ready, please introduce yourself and tell me about your background."
                )

                session.add_assistant_message(greeting_text)
                await ws.send_json({"type": "assistant_text", "payload": greeting_text})

                try:
                    first_chunk = True
                    async for chunk in stream_tts(greeting_text):
                        if chunk:
                            if first_chunk:
                                await ws.send_json({"type": "status", "payload": "speaking"})
                                first_chunk = False
                            b64 = base64.b64encode(chunk).decode("utf-8")
                            await ws.send_json({"type": "audio", "payload": b64})
                except Exception as tts_err:
                    print(f"[Greeting TTS Exception]: {tts_err}")

                await ws.send_json({"type": "status", "payload": "ready"})

            elif msg_type == "audio":
                payload = data.get("payload")
                if not payload:
                    continue

                raw_chunk = base64.b64decode(payload)
                session.append_audio(raw_chunk)
                packet_count += 1
                print(f"[WebSocket] Received audio chunk: {len(raw_chunk)} bytes")
                await ws.send_json({"type": "status", "payload": "listening"})

            elif msg_type == "audio_end":
                packet_count = 0
                full_audio = session.consume_audio()
                print(f"[WebSocket] audio_end received. Total audio payload: {len(full_audio)} bytes")

                if not full_audio or len(full_audio) < 200:
                    await ws.send_json({"type": "status", "payload": "ready"})
                    continue

                await process_audio_to_voice(ws, session, full_audio)

            elif msg_type == "interrupt":
                packet_count = 0
                session.consume_audio()
                await ws.send_json({"type": "status", "payload": "listening"})

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
    """STT → LLM → TTS voice interaction pipeline"""

    await ws.send_json({"type": "status", "payload": "transcribing"})

    text = await transcribe_audio(audio_bytes)
    print(f"[WebSocket STT Transcribed Text]: '{text}'")

    if not text or len(text.strip()) < 2 or text.startswith("["):
        print("[WebSocket STT] No clear speech recognized in audio. Resetting status to ready.")
        await ws.send_json({"type": "status", "payload": "ready"})
        return

    session.add_user_message(text)
    await ws.send_json({"type": "user_text", "payload": text})
    await ws.send_json({"type": "status", "payload": "thinking"})

    full_response = ""
    async for token in stream_completion(session.get_llm_messages()):
        full_response += token
        await ws.send_json({"type": "llm_token", "payload": token})

    if not full_response:
        await ws.send_json({"type": "status", "payload": "ready"})
        return

    session.add_assistant_message(full_response)
    await ws.send_json({"type": "assistant_text", "payload": full_response})

    # Synthesize complete response with Edge TTS and emit speaking status with audio
    first_chunk = True
    async for chunk in stream_tts(full_response):
        if chunk:
            if first_chunk:
                await ws.send_json({"type": "status", "payload": "speaking"})
                first_chunk = False
            b64 = base64.b64encode(chunk).decode("utf-8")
            await ws.send_json({"type": "audio", "payload": b64})

    await ws.send_json({"type": "status", "payload": "ready"})
