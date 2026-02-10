"""
Speech-to-Text module for AI Avatar Interaction.
Uses local Whisper for offline, zero-cost transcription.
"""

import os
import tempfile
from typing import Optional

import whisper

# 🔑 LOAD MODEL ONCE (VERY IMPORTANT)
WHISPER_MODEL = whisper.load_model("tiny")


async def transcribe_audio(audio_bytes: bytes, lang: Optional[str] = "en") -> str:
    """
    Transcribe audio to text using local Whisper.
    """
    return await _transcribe_whisper_local(audio_bytes, lang)


async def _transcribe_whisper_local(audio_bytes: bytes, lang: str) -> str:
    """
    Use local Whisper (already loaded).
    """
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            path = f.name

        try:
            result = WHISPER_MODEL.transcribe(
                path,
                language=lang,
                fp16=False
            )
            return (result.get("text") or "").strip()

        finally:
            os.unlink(path)

    except Exception as e:
        return f"[STT Error: {str(e)}]"
