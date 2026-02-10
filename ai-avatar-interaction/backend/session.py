"""
Session management for AI Avatar Interaction.
Tracks conversation context, maintains LLM history,
and buffers audio for Whisper STT.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any
from datetime import datetime


@dataclass
class Message:
    role: str
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Session:
    """Per-connection session state."""
    session_id: str

    # 🔹 LLM conversation state
    messages: List[Message] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    # 🔹 AUDIO BUFFER (THIS IS THE FIX)
    audio_buffer: bytearray = field(default_factory=bytearray)

    SYSTEM_PROMPT = (
        "You are an AI interviewer for a professional hiring evaluation. "
        "Respond naturally, concisely, and conversationally. "
        "Keep replies brief (1-3 sentences) to maintain real-time feel. "
        "Be warm, professional, and engaging."
    )

    def __post_init__(self):
        self.messages.append(
            Message(role="system", content=self.SYSTEM_PROMPT)
        )

    def append_audio(self, chunk: bytes) -> None:
        """Append raw audio chunk from WebSocket."""
        self.audio_buffer.extend(chunk)

    def consume_audio(self) -> bytes:
        """
        Return full buffered audio and clear buffer.
        Called when mic stops.
        """
        data = bytes(self.audio_buffer)
        self.audio_buffer.clear()
        return data

    def add_user_message(self, content: str) -> None:
        self.messages.append(Message(role="user", content=content))

    def add_assistant_message(self, content: str) -> None:
        self.messages.append(Message(role="assistant", content=content))

    def get_llm_messages(self, max_recent: int = 10) -> List[Dict[str, str]]:
        """Return messages in OpenAI-compatible format."""
        msgs = [self.messages[0]] + self.messages[-max_recent:]
        return [{"role": m.role, "content": m.content} for m in msgs]
