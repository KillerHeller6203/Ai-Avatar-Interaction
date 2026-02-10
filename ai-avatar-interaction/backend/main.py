"""
AI Avatar Interaction - FastAPI Backend
Entry point for the voice + AI + face interaction system.
"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from websocket import handle_websocket

app = FastAPI(
    title="AI Avatar Interaction",
    description="Real-time voice + LLM + TTS pipeline for hiring evaluation",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "AI Avatar Interaction",
        "status": "ok",
        "ws": "/ws",
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await handle_websocket(websocket)


if __name__ == "__main__":
    import uvicorn
    from config import WS_HOST, WS_PORT
    uvicorn.run(app, host=WS_HOST, port=WS_PORT)
