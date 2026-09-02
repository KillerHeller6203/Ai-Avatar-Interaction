"""
LLM module for AI Avatar Interaction.
Supports Gemini API (streaming) when GEMINI_API_KEY is available,
with automatic fallback to local Ollama.
"""

from typing import AsyncGenerator, List, Dict
import os
import json
import httpx

from config import OLLAMA_BASE_URL, OLLAMA_MODEL


async def stream_completion(
    messages: List[Dict[str, str]],
    model: str = OLLAMA_MODEL
) -> AsyncGenerator[str, None]:
    """
    Stream LLM tokens from Gemini API if GEMINI_API_KEY is present,
    otherwise fallback to local Ollama.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")

    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            system_prompt = ""
            contents = []
            for m in messages:
                role = m.get("role")
                text = m.get("content", "")
                if role == "system":
                    system_prompt += text + "\n"
                elif role == "user":
                    contents.append({"role": "user", "parts": [text]})
                elif role == "assistant":
                    contents.append({"role": "model", "parts": [text]})

            if contents:
                gemini_model = None
                for m_name in ["models/gemini-1.5-flash", "gemini-1.5-flash", "models/gemini-1.5-pro"]:
                    try:
                        gemini_model = genai.GenerativeModel(
                            model_name=m_name,
                            system_instruction=system_prompt if system_prompt else None
                        )
                        break
                    except Exception:
                        continue

                if gemini_model:
                    response = gemini_model.generate_content(contents, stream=True)
                    for chunk in response:
                        try:
                            if hasattr(chunk, "text") and chunk.text:
                                yield chunk.text
                        except Exception:
                            pass
                    return
        except Exception as e:
            print(f"[Gemini fallback to Ollama: {str(e)}]")

    # 🔹 Local Ollama Fallback Stream
    ollama_url = f"{OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }

    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", ollama_url, json=payload) as response:
                async for line in response.aiter_lines():
                    if not line:
                        continue

                    data = json.loads(line)
                    if "message" in data and "content" in data["message"]:
                        yield data["message"]["content"]

    except Exception as e:
        print(f"[LLM Error: {str(e)}]")
        user_turn_count = sum(1 for m in messages if m.get("role") == "user")
        
        fallback_questions = [
            "That's a great intro! Could you tell me more about a challenging technical project you worked on recently?",
            "Thanks for sharing! What specific technologies or frameworks did you use most in that implementation?",
            "Interesting! What was the most difficult bug or performance bottleneck you encountered in that project, and how did you fix it?",
            "Great problem-solving approach. How did you handle testing, code reviews, and collaboration with your team on that feature?",
            "That sounds like a solid technical experience. Do you have any questions for me about the team, tech stack, or engineering culture?"
        ]
        
        idx = min(user_turn_count - 1, len(fallback_questions) - 1) if user_turn_count > 0 else 0
        yield fallback_questions[idx]
