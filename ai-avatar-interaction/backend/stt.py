"""
Speech-to-Text module for AI Avatar Interaction.
Uses local Whisper for offline, zero-cost transcription.
"""

import os
import tempfile
import asyncio
from typing import Optional

import shutil

try:
    import imageio_ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    ffmpeg_dir = os.path.dirname(ffmpeg_exe)
    target_ffmpeg = os.path.join(ffmpeg_dir, "ffmpeg.exe")
    if not os.path.exists(target_ffmpeg):
        try:
            shutil.copy(ffmpeg_exe, target_ffmpeg)
        except Exception:
            pass

    if ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
except Exception as e:
    print(f"[STT ffmpeg warning: {str(e)}]")

import whisper

# 🔑 LOAD MODEL ONCE (HIGH ACCURACY FOR NAMES & TECH ROLES)
WHISPER_MODEL = whisper.load_model("tiny.en")


def _transcribe_sync(audio_bytes: bytes, lang: str) -> str:
    if not audio_bytes or len(audio_bytes) < 500:
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
        return f"[STT Error: {str(e)}]"


async def transcribe_audio(audio_bytes: bytes, lang: Optional[str] = "en") -> str:
    """
    Transcribe audio to text using local Whisper asynchronously off the event loop thread.
    """
    return await asyncio.to_thread(_transcribe_sync, audio_bytes, lang or "en")
