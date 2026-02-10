# AI Avatar Interaction - Demo Guide

## What to Show

1. **Webcam** – Face representation in real time
2. **Microphone** – Start mic, speak clearly
3. **AI response** – Text appears (near real-time), then voice plays
4. **Transcript** – User and AI text shown below

## Demo Flow

1. Open `http://localhost:3000`
2. Allow webcam and microphone when prompted
3. Ensure status shows `connected`
4. Click **Start mic**
5. Speak: e.g. *"Tell me about yourself"* or *"What are your strengths?"*
6. After ~1–2 seconds, transcription appears; AI response is generated; TTS plays

## If Live Demo Is Unstable

- **Record a video** showing:
  - Speaking into the mic
  - AI responding via voice
  - Webcam visible

- **Explain verbally**:
  - "Voice is captured every second"
  - "STT runs on that chunk"
  - "LLM streams tokens"
  - "TTS returns full audio, which we play"

## Troubleshooting

| Issue | Check |
|-------|------|
| `disconnected` | Backend running on port 8000? |
| No transcription | Is local Whisper installed? Is FFmpeg available? |
| No audio | Browser autoplay policy; click page first |
| Webcam fails | HTTPS or localhost required for getUserMedia |
