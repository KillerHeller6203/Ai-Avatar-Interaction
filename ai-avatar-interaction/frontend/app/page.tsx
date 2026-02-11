"use client";

import { useState, useCallback, useRef } from "react";
import { AudioInput, AudioOutput, FaceView } from "@/components";

const WS_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//127.0.0.1:8000/ws`
    : "ws://127.0.0.1:8000/ws";

export default function Home() {
  const wsRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<string>("disconnected");
  const [streamingText, setStreamingText] = useState("");
  const [transcript, setTranscript] = useState<
    Array<{ role: string; text: string }>
  >([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioOutputRef = useRef<{ playChunk: (b: string) => void } | null>(null);

  // 🔹 Manual WebSocket connect (NO auto-connect)
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      setStatus("connected");
    };

    socket.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
    };

    socket.onerror = () => {
      setStatus("error");
    };

    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const type = msg.type;
        const payload = msg.payload ?? "";

        if (type === "status") {
          setStatus(payload);
          setIsSpeaking(payload === "speaking");
        } else if (type === "user_text") {
          setTranscript((prev) => [
            ...prev,
            { role: "user", text: payload },
          ]);
          setStreamingText("");
        } else if (type === "llm_token") {
          setStreamingText((prev) => prev + payload);
        } else if (type === "assistant_text") {
          setTranscript((prev) => [
            ...prev,
            { role: "assistant", text: payload },
          ]);
          setStreamingText("");
        } else if (type === "audio") {
          audioOutputRef.current?.playChunk(payload);
        }
      } catch {
        // ignore malformed messages
      }
    };
  }, []);

  // const sendAudio = useCallback((base64: string) => {
  //   const socket = wsRef.current;
  //   if (socket?.readyState === WebSocket.OPEN) {
  //     socket.send(
  //       JSON.stringify({
  //         type: "audio",
  //         payload: base64,
  //       })
  //     );
  //   }
  // }, []);
    const sendAudio = useCallback((base64: string) => {
          const socket = wsRef.current;
          if (!socket || socket.readyState !== WebSocket.OPEN) return;

          if (base64 === "__AUDIO_END__") {
            socket.send(JSON.stringify({ type: "audio_end" }));
          } else {
            socket.send(
              JSON.stringify({
                type: "audio",
                payload: base64,
              })
            );
          }
        }, []);


  return (
    <main className="main">
      <h1>AI Avatar Interaction</h1>

      <div className="status-row">
        <span
          className={`ws-status ${
            status === "connected" || status === "ready"
              ? "connected"
              : status === "error"
              ? "error"
              : ""
          }`}
        >
          {status}
        </span>

        {(status === "disconnected" || status === "error") && (
          <button onClick={connect} className="reconnect-btn">
            Connect
          </button>
        )}
      </div>

      <FaceView isSpeaking={isSpeaking} />

      <AudioInput
        onAudioChunk={sendAudio}
        disabled={status === "disconnected" || status === "error"}
      />


      <div className="transcript">
        {transcript.map((m, i) => (
          <div key={i} className={m.role}>
            {m.role === "user" ? "You: " : "AI: "}
            {m.text}
          </div>
        ))}

        {streamingText && (
          <div className="assistant streaming">{streamingText}</div>
        )}
      </div>

      <AudioOutput ref={audioOutputRef} />
    </main>
  );
}
