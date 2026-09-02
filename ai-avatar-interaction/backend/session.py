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

    def set_interview_context(
        self,
        resume_text: str = "",
        job_role: str = "",
        interview_type: str = "general",
        interviewer_tone: str = "professional",
    ) -> None:
        """Update system prompt with candidate resume, job role, interview type (HR/TR), and interviewer tone."""
        type_desc = {
          "hr": "HR / Behavioral interview (evaluating culture fit, teamwork, leadership, situational responses, STAR method).",
          "tr": "Technical / TR interview (evaluating coding logic, domain knowledge, system design, technical problem solving).",
          "general": "General hiring interview covering both technical skills and background experience."
        }.get(interview_type, "General hiring evaluation.")

        tone_desc = {
          "professional": "Maintain a formal, crisp, professional hiring manager tone.",
          "friendly": "Maintain a warm, encouraging, supportive interviewer tone.",
          "strict": "Maintain a rigorous, challenging tone. Probe for depth, edge cases, and clarity.",
          "conversational": "Maintain a relaxed, casual peer-to-peer conversation tone."
        }.get(interviewer_tone, "Maintain a professional tone.")

        prompt = (
            f"You are an AI interviewer conducting a {type_desc} "
            f"{tone_desc} "
            "Respond naturally, concisely, and conversationally. "
            "Keep replies brief (1-3 sentences) to maintain real-time interactive feel. "
            "Ask one clear question at a time.\n\n"
        )
        if job_role:
            prompt += f"Target Job Role: {job_role}\n"
        if resume_text:
            prompt += f"Candidate Resume:\n{resume_text[:2500]}\n"

        if self.messages and self.messages[0].role == "system":
            self.messages[0] = Message(role="system", content=prompt)
        else:
            self.messages.insert(0, Message(role="system", content=prompt))

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
