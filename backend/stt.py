"""
Speech-to-Text module for AI Avatar Interaction.
Uses Gemini Cloud STT as primary (0 RAM overhead, ultra-fast for Render 512MB RAM limit).
Includes fallback to local Whisper if PyTorch is installed locally.
"""

import os
import asyncio
import tempfile
from typing import Optional
import google.generativeai as genai

# Optional local Whisper import for offline local development
WHISPER_MODEL = None
try:
    import whisper
    WHISPER_MODEL = whisper.load_model("tiny.en")
except Exception:
    pass


def _transcribe_gemini_sync(audio_bytes: bytes) -> str:
    """
    Transcribe audio bytes directly using Gemini 1.5 Flash multimodal capability.
    Requires 0 RAM overhead and processes WebM audio natively.
    """
    if not audio_bytes or len(audio_bytes) < 500:
        return ""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            [
                {
                    "mime_type": "audio/webm",
                    "data": audio_bytes,
                },
                "Listen to this interview candidate voice recording and transcribe the exact spoken words into plain text. Output ONLY the raw transcript text with no extra commentary, quotes, or metadata tags.",
            ]
        )
        text = (response.text or "").strip()
        # Strip potential markdown quotes
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        return text
    except Exception as e:
        print(f"[Gemini STT Error: {e}]")
        return ""


def _transcribe_whisper_sync(audio_bytes: bytes) -> str:
    """
    Fallback offline transcription using local Whisper model.
    """
    if not WHISPER_MODEL or not audio_bytes or len(audio_bytes) < 500:
        return ""

    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            path = f.name

        try:
            result = WHISPER_MODEL.transcribe(
                path,
                language="en",
                fp16=False,
                beam_size=1,
                temperature=0.0
            )
            return (result.get("text") or "").strip()
        finally:
            if os.path.exists(path):
                os.unlink(path)
    except Exception as e:
        print(f"[Whisper STT Error: {e}]")
        return ""


async def transcribe_audio(audio_bytes: bytes, lang: Optional[str] = "en") -> str:
    """
    Transcribe audio bytes to text asynchronously off the event loop thread.
    Prioritizes Gemini Cloud STT for 0 RAM usage on Render.com free tier.
    """
    # 1. Try Gemini Cloud STT first (Ultra-fast, 0 RAM)
    transcript = await asyncio.to_thread(_transcribe_gemini_sync, audio_bytes)
    if transcript:
        return transcript

    # 2. Fallback to local Whisper STT if Gemini STT is unconfigured or fails
    if WHISPER_MODEL:
        return await asyncio.to_thread(_transcribe_whisper_sync, audio_bytes)

    return ""
