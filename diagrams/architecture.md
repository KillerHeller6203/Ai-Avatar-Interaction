# AI Avatar Interaction - Architecture

## System Flow (Boxes + Arrows)

```
                    ┌──────────────────────────────────────────────────────────────────┐
                    │                         FRONTEND                                  │
                    │                                                                  │
  ┌─────────┐       │  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐   │
  │   Mic   │──────▶│  │ AudioInput  │────▶│  WebSocket   │◀────│  AudioOutput    │   │
  └─────────┘       │  └─────────────┘     │    Client    │     └────────▲────────┘   │
                    │         │            └──────┬───────┘              │            │
                    │         │                   │                      │            │
                    │  ┌──────▼───────────────────▼──────┐               │            │
                    │  │         Face View               │               │            │
                    │  │  (real webcam <video autoplay>) │               │            │
                    │  └─────────────────────────────────┘               │            │
                    └───────────────────────────────────────────────────┼────────────┘
                                                                        │
                              ws://host:8000/ws                         │
                                                                        │
                    ┌───────────────────────────────────────────────────┼────────────┐
                    │                         BACKEND                   │            │
                    │                                                    │            │
  audio chunks      │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────┴─────┐      │
  ────────────────▶│  │   STT   │──▶│   LLM   │──▶│   TTS   │──▶│   Audio   │──────┘
  (base64)         │  │ Whisper │   │ OpenAI  │   │ OpenAI  │   │  (mp3)    │
                    │  └─────────┘   └────┬────┘   └─────────┘   └──────────┘
                    │                     │
                    │                     │ token stream
                    │                     ▼
                    │              ┌─────────────┐
                    │              │   Session   │
                    │              │  (context)  │
                    │              └─────────────┘
                    └──────────────────────────────────────────────────┘
```

## Pipeline: Mic → STT → LLM → TTS → Audio Output + Face View

1. **Mic** — MediaRecorder captures 1s chunks
2. **STT** — Whisper transcribes to text
3. **LLM** — OpenAI streams tokens to client
4. **TTS** — OpenAI generates full mp3
5. **Audio Output** — Web Audio API plays
6. **Face View** — Webcam feed shown alongside

## Latency Notes

- Streaming: LLM tokens
- Non-streaming: STT, TTS (full response before playback)
