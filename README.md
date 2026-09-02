# Resumé Edge — AI Resume Enhancer & Interactive Interview Avatar

**Resumé Edge** is an end-to-end AI platform featuring an **Interactive Voice-Based AI Interviewer Avatar** and a **Smart AI Resume Enhancer & ATS Analyzer**.

---

## 🌟 Key Features

### 🎙️ 1. Interactive Voice-Based AI Interviewer Avatar
- **Real-Time Voice Turn-Taking**: Real-time hands-free audio conversation with Voice Activity Detection (VAD).
- **Turn-Taking Echo Suppression**: Automatically mutes the candidate microphone while the AI avatar speaks to prevent speaker echo loops.
- **Context-Aware Interviewing**: Reads candidate resume PDF, target job role, experience level, HR/Technical evaluation mode, and preferred interviewer tone.
- **2D Canvas Face Avatar**: Lips animate in real-time synchronized to speaker playback with side audio equalizer waves and dynamic status badges (`Model is Speaking...`, `Model is Thinking...`, `Model is Listening...`).
- **Comprehensive Performance Reports**: Evaluates candidates out of 100 with category breakdowns, strengths, key improvement areas, and question-by-question high-impact answer rewrites.

### 📄 2. AI Resume Enhancer & ATS Analyzer
- **ATS Match Score**: Detailed ATS score ring out of 100 aligned with your target job role.
- **PDF & Text Analysis**: Upload PDF resumes or paste plain text.
- **Structured Feedback**: Actionable recommendations across formatting, technical keywords, and executive summaries.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, TypeScript, Web Audio API, Canvas 2D.
- **Backend**: Python 3.11, FastAPI, Uvicorn, WebSockets (`wss://`).
- **AI / Speech Engines**:
  - **LLM**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`).
  - **STT (Speech-to-Text)**: OpenAI Whisper (`tiny.en` / `base`) + FFmpeg.
  - **TTS (Text-to-Speech)**: Microsoft Edge TTS (`en-US-JennyNeural`).
  - **PDF Parser**: `pdfplumber`.

---

## 🚀 Local Development Setup

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
# Activate on Windows:
.venv\Scripts\activate
# Activate on Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (copy from .env.example)
cp .env.example .env
# Set GEMINI_API_KEY=your_gemini_api_key

# Run FastAPI backend server
python main.py
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run Next.js development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🌐 Production Deployment

- **Frontend**: Deploy `frontend` directory to **[Vercel](https://vercel.com)**.
  - Set Environment Variables:
    - `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com`
    - `NEXT_PUBLIC_WS_URL` = `wss://your-backend.onrender.com/ws`

- **Backend**: Deploy `backend` directory to **[Render.com](https://render.com)** as a Docker Web Service using the provided `Dockerfile`.
  - Set Environment Variable:
    - `GEMINI_API_KEY` = `your_gemini_api_key`

---

## 🔒 Privacy & Security

Resumé Edge operates with zero data persistence. Resumes and audio streams are processed in memory and are never stored on disk or shared with third parties.
