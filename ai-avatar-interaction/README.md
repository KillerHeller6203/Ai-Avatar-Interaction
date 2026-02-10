# AI Avatar Interaction

A real-time voice + AI interaction system for **AdxReel hiring evaluations**. The goal: an interviewer feels they are *directly talking to the candidate*, even though the interaction is mediated by AI, voice, and streaming systems.

## Problem Statement (AdxReel)

Build a system where:

- The candidate's voice is captured via microphone
- Speech is converted to text (STT)
- An LLM generates responses in real time
- Responses are spoken back via Text-to-Speech
- A visual face representation is shown (real webcam feed)
- The entire loop feels live, not delayed

This repository delivers that working prototype.

---

## Project Overview

| Component | Technology |
|-----------|------------|
| Microphone input | Browser MediaRecorder (1s chunks) |
| Speech-to-Text | Whisper (API or local) |
| LLM | OpenAI (streaming) |
| Text-to-Speech | OpenAI TTS |
| Face representation | Real webcam feed (`<video autoplay>`) |

The pipeline runs over **WebSockets** for low latency and streaming where supported.

---

## Real-Time Voice → AI → Voice Pipeline

End-to-end flow:

1. **Mic** → MediaRecorder captures 1-second chunks → base64 → WebSocket
2. **STT** → Whisper transcribes the chunk to text
3. **LLM** → OpenAI generates a response; tokens stream to the client as they arrive
4. **TTS** → OpenAI TTS generates full mp3 → sent to client
5. **Audio out** → Web Audio API decodes and plays
6. **Face** → Webcam feed shown via `<video autoplay>`

---

## Streaming Status (Honest)

| Stage | Current behavior | Fully streaming? |
|-------|------------------|------------------|
| **Audio input** | Batched every 1s | Partially — could use VAD or shorter chunks |
| **STT** | Waits for full chunk | No — Whisper API does not stream |
| **LLM** | Token-by-token | Yes — tokens stream to client |
| **TTS** | Full mp3 sent at once | No — OpenAI TTS returns full audio |
| **Audio output** | Plays full mp3 when received | Partially — playback starts when ready |

To achieve full token-level + audio streaming:

- **STT**: Use a streaming-capable model (e.g. Whisper live, Deepgram, AssemblyAI)
- **TTS**: Use ElevenLabs or Coqui streaming TTS so audio chunks play before the full sentence completes
- **Audio input**: Add VAD (Voice Activity Detection) to send only when speech is detected

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js + React)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Mic ──▶ AudioInput ──▶ WebSocket ◀── AudioOutput ──▶ speakers             │
│              │                  │              ▲                             │
│              │                  │              │                             │
│              │                  ▼              │                             │
│              │            FaceView (webcam)    │                             │
│              │            Transcript UI       │                             │
│              │                                │                             │
└──────────────┼────────────────────────────────┼─────────────────────────────┘
               │                                │
               │   ws://host:8000/ws            │
               ▼                                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Audio chunks ──▶ STT (Whisper) ──▶ LLM (OpenAI stream) ──▶ TTS (OpenAI)   │
│                            │                        │              │         │
│                            ▼                        ▼              ▼         │
│                      Session (context)         llm_token     full mp3        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

See `diagrams/architecture.md` for more detail.

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- `OPENAI_API_KEY` (required for LLM and TTS)

### Backend

```bash
cd ai-avatar-interaction/backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
```

### Frontend

```bash
cd ai-avatar-interaction/frontend
npm install
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key (LLM + TTS; optional Whisper) |
| `USE_WHISPER_API` | No | `true` to use Whisper API instead of local |
| `TTS_PROVIDER` | No | `openai` \| `elevenlabs` (default: openai) |
| `ELEVENLABS_API_KEY` | No | For ElevenLabs TTS |

## Run

1. **Start backend** (port 8000):

```bash
cd backend
python main.py
```

2. **Start frontend** (port 3000):

```bash
cd frontend
npm run dev
```

3. Open `http://localhost:3000` in a browser. Allow webcam and microphone when prompted.

---

## Latency Considerations

| Stage | Typical latency | Notes |
|-------|-----------------|-------|
| Audio chunk | ~1000 ms | MediaRecorder 1s interval |
| STT | 200–800 ms | Whisper API faster than local |
| LLM first token | 200–500 ms | Streaming reduces perceived latency |
| TTS | 500–1500 ms | Depends on text length |
| **Total** | ~2–4 s | End-to-end from speech end to playback |

**Where latency is minimized**: LLM token streaming, WebSocket (no REST round-trips), async backend.

**Bottlenecks**: 1s audio batching, non-streaming STT/TTS, full TTS before playback.

---

## Cost Awareness

- **OpenAI**: Whisper API, gpt-4o-mini, TTS — billed per request
- **Local Whisper**: No API cost; higher latency and local compute

---

## Trade-offs (3-Day Constraint)

| Decision | Reason |
|----------|--------|
| Full TTS in one payload | Browsers can't decode partial MP3; streaming TTS needs ElevenLabs |
| 1 s audio chunks | Balance between latency and transcription quality |
| OpenAI TTS | Simple and reliable; ElevenLabs optional for quality |
| Webcam over AI avatar | Faster to implement; feels more natural for interviews |
| No VAD | Keeps scope small; could add for push-to-talk or auto-send |

---

## Honest Limitations

- No Voice Activity Detection — user manually starts/stops mic
- TTS playback starts only after full response is generated
- Webcam requires HTTPS or localhost
- No lip sync or emotion-driven expressions

---

## Future Improvements

- Voice Activity Detection (VAD) for automatic send
- Streaming TTS (ElevenLabs / Coqui) for audio before full response
- Lip sync or expression hints from TTS
- Virtual background option

---

Honesty over perfection. This is a working prototype that demonstrates real-time AI-mediated conversation.
