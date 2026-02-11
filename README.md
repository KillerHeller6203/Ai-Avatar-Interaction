## AI Avatar Interaction System

A real-time AI avatar interview system that enables natural voice-based interaction using Speech-to-Text (STT), Large Language Models (LLM), and Text-to-Speech (TTS). The system simulates a professional interviewer with conversational responses and audio playback.

---

## Features

- Real-time voice input via browser microphone
- AI-driven interviewer with conversational context
- Streaming transcription (STT) using local Whisper (offline, zero cost)
- Streaming LLM responses for low-latency interaction
- Text-to-Speech (TTS) audio playback in the browser
- WebSocket-based pipeline for real-time communication
- Modular backend design (STT, LLM, TTS isolated)

---

## Architecture Overview

```
Browser (Mic)
   ↓
WebSocket (Audio)
   ↓
Speech-to-Text (Whisper)
   ↓
LLM (Streaming Tokens)
   ↓
Text-to-Speech
   ↓
Browser (Audio Output + Avatar)

```

---

## Tech Stack

## Frontend
- Next.js (React)
- Web Audio API
- MediaRecorder API
- WebSockets

## Backend
- FastAPI
- WebSockets
- Local Whisper (STT)
- Streaming LLM inference
- TTS engine
- FFmpeg (audio decoding)

---

## Project Structure

``` bash
ai-avatar-interaction/
│
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── websocket.py         # WebSocket handler
│   ├── session.py           # Session + conversation state
│   ├── stt.py               # Whisper STT module
│   ├── llm.py               # LLM streaming logic
│   └── tts.py               # Text-to-Speech module
│
├── frontend/
│   ├── components/
│   │   ├── AudioInput.tsx
│   │   ├── AudioOutput.tsx
│   │   └── FaceView.tsx
│   └── app/page.tsx
│
└── README.md
```

---

## Setup Instructions
## Prerequisites
- Python 3.9+
- Node.js 18+
- FFmpeg installed and added to PATH

---

## Backend Setup
``` bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
## Run Backend
```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

## Frontend Setup
``` bash
cd frontend
npm install
npm run dev
```
Open:
```bash
http://localhost:3000
```

---

## Usage
- Start backend server
- Start frontend app
- Click Connect
- Click Start Mic, speak naturally
- Click Stop Mic
- AI transcribes, thinks, responds, and speaks back

---

## Design Goals
- Low latency interaction
- Natural conversational flow
- Offline-friendly STT
- Clean separation of concerns
- Easy extensibility (avatars, emotion, interview logic)

## Future Improvements
- Partial STT streaming (no mic stop required)
- Emotion-aware avatar expressions
- Multiple interview modes
- Better audio chunking
- Docker support
- Cloud deployment
