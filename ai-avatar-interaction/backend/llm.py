"""
LLM module for AI Avatar Interaction.
Uses local Ollama (LLaMA) with streaming for near real-time feel.
"""

from typing import AsyncGenerator, List, Dict
import httpx
import json

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "llama3"  # works with: ollama pull llama3


async def stream_completion(
    messages: List[Dict[str, str]],
    model: str = MODEL
) -> AsyncGenerator[str, None]:
    """
    Stream LLM tokens from Ollama.
    Yields partial text as it arrives.
    """

    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }

    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", OLLAMA_URL, json=payload) as response:
                async for line in response.aiter_lines():
                    if not line:
                        continue

                    data = json.loads(line)
                    if "message" in data and "content" in data["message"]:
                        yield data["message"]["content"]

    except Exception as e:
        yield f"[LLM Error: {str(e)}]"
