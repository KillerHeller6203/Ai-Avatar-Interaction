"""
Text-to-Speech module for AI Avatar Interaction.
Supports: Edge TTS (free, local) or ElevenLabs (optional).
"""

from typing import AsyncGenerator
import asyncio
import tempfile
import os

from config import TTS_PROVIDER, ELEVENLABS_API_KEY


async def stream_tts(text: str) -> AsyncGenerator[bytes, None]:
    """
    Stream TTS audio chunks. Yields raw WAV audio bytes.
    """
    if TTS_PROVIDER == "elevenlabs" and ELEVENLABS_API_KEY:
        async for chunk in _tts_elevenlabs(text):
            yield chunk
    else:
        async for chunk in _tts_edge(text):
            yield chunk


async def _tts_edge(text: str) -> AsyncGenerator[bytes, None]:
    """
    Edge TTS (free, local). Generates WAV audio.
    """
    try:
        import edge_tts

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            path = f.name

        communicate = edge_tts.Communicate(
            text=text,
            voice="en-US-JennyNeural",
        )

        await communicate.save(path)

        with open(path, "rb") as f:
            data = f.read()

        chunk_size = 4096
        for i in range(0, len(data), chunk_size):
            yield data[i : i + chunk_size]

        os.unlink(path)

    except Exception as e:
        # On failure, return silence instead of crashing
        return


async def _tts_elevenlabs(text: str) -> AsyncGenerator[bytes, None]:
    """
    ElevenLabs streaming TTS (optional).
    """
    try:
        from elevenlabs import AsyncElevenLabs

        client = AsyncElevenLabs(api_key=ELEVENLABS_API_KEY)
        audio_stream = await client.text_to_speech.convert_as_stream(
            voice_id="21m00Tcm4TlvDq8ikWAM",
            text=text,
        )

        async for chunk in audio_stream:
            yield chunk

    except Exception:
        return
