"""
Configuration for AI Avatar Interaction backend.
Environment-driven, provider-agnostic, prototype-friendly.
"""

import os
from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
USE_WHISPER_API = os.getenv("USE_WHISPER_API", "false").lower() == "true"
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "edge")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
# WebSocket
WS_HOST = os.getenv("WS_HOST", "0.0.0.0")
WS_PORT = int(os.getenv("WS_PORT", "8000"))
