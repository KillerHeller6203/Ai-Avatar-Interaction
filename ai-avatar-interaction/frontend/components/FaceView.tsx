"use client";

import { useRef, useEffect, useState } from "react";

interface FaceViewProps {
  isSpeaking?: boolean;
  wsStatus?: string;
  className?: string;
}

type ViewMode = "dual" | "avatar" | "webcam";

export default function FaceView({ isSpeaking, wsStatus, className }: FaceViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isModelSpeaking = isSpeaking || wsStatus === "speaking";

  const [viewMode, setViewMode] = useState<ViewMode>("dual");
  const [hasWebcam, setHasWebcam] = useState(false);

  // Initialize camera for candidate webcam once on mount
  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setHasWebcam(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.error("Webcam access failed:", err);
        setHasWebcam(false);
      }
    };

    startCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Instant re-sync stream to video element whenever viewMode or videoRef updates
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(() => {});
    }
  }, [viewMode, hasWebcam]);

  // Render 2D Animated AI Avatar Canvas
  useEffect(() => {
    if (viewMode === "webcam") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let blinkTimer = 0;
    let isBlinking = false;

    const render = () => {
      time += 0.05;

      const w = (canvas.width = canvas.clientWidth || 400);
      const h = (canvas.height = canvas.clientHeight || 300);

      const cx = w / 2;
      const cy = h / 2 - 10;

      ctx.clearRect(0, 0, w, h);

      // Background radial gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 180);
      bgGrad.addColorStop(0, "#1a2436");
      bgGrad.addColorStop(1, "#0d131d");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Audio Equalizer Waveforms on sides when speaking
      const numBars = 14;
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < numBars; i++) {
          const x = cx + side * (115 + i * 8);
          const barHeight = isModelSpeaking
            ? Math.sin(time * 5 + i * 0.4) * 25 + Math.random() * 20 + 10
            : 4 + Math.sin(time * 2 + i * 0.3) * 3;

          ctx.fillStyle = isModelSpeaking ? "#C8F135" : "#38bdf8";
          ctx.shadowColor = isModelSpeaking ? "#C8F135" : "#38bdf8";
          ctx.shadowBlur = isModelSpeaking ? 10 : 2;
          ctx.fillRect(x - 2, cy - barHeight / 2, 4, barHeight);
          ctx.shadowBlur = 0;
        }
      }

      // Outer Aura Glow Ring around Head
      const pulseRadius = 88 + Math.sin(time * 2) * 3 + (isModelSpeaking ? Math.sin(time * 10) * 6 : 0);
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isModelSpeaking ? "rgba(200, 241, 53, 0.4)" : "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = isModelSpeaking ? 3 : 1.5;
      ctx.stroke();

      // Head Base Shape
      ctx.beginPath();
      ctx.ellipse(cx, cy, 75, 86, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#111927";
      ctx.strokeStyle = isModelSpeaking ? "#C8F135" : "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Visor Inner Glow
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 58, 42, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "rgba(200, 241, 53, 0.15)";
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();

      // Blinking Logic
      blinkTimer++;
      if (blinkTimer > 160) {
        isBlinking = true;
        if (blinkTimer > 172) {
          isBlinking = false;
          blinkTimer = 0;
        }
      }

      // Eyes
      const eyeOffset = 22;
      const eyeY = cy - 14;
      const eyeRadiusY = isBlinking ? 1 : 10;
      const eyeRadiusX = 14;

      for (const side of [-1, 1]) {
        const eyeX = cx + side * eyeOffset;

        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = isModelSpeaking ? "#C8F135" : "#38bdf8";
        ctx.shadowColor = isModelSpeaking ? "#C8F135" : "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!isBlinking) {
          ctx.beginPath();
          ctx.arc(eyeX + Math.sin(time) * 1.5, eyeY, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }
      }

      // Eyebrows
      for (const side of [-1, 1]) {
        const browX = cx + side * eyeOffset;
        const browY = cy - 30 + (isModelSpeaking ? Math.sin(time * 6) * 2 : 0);
        ctx.beginPath();
        ctx.moveTo(browX - 12, browY);
        ctx.lineTo(browX + 12, browY - side * 2);
        ctx.strokeStyle = isModelSpeaking ? "#C8F135" : "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Mouth Animation
      const mouthY = cy + 30;
      const mouthWidth = 28 + (isModelSpeaking ? Math.sin(time * 8) * 6 : 0);
      const mouthHeight = isModelSpeaking ? Math.abs(Math.sin(time * 12)) * 18 + 4 : 3;

      ctx.beginPath();
      ctx.ellipse(cx, mouthY, mouthWidth / 2, mouthHeight / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = isModelSpeaking ? "#C8F135" : "transparent";
      ctx.strokeStyle = isModelSpeaking ? "#C8F135" : "#38bdf8";
      ctx.lineWidth = 2;
      if (isModelSpeaking) ctx.fill();
      ctx.stroke();

      // Status Badge
      const statusText = isModelSpeaking
        ? "Model is Speaking..."
        : wsStatus === "thinking"
        ? "Model is Thinking..."
        : wsStatus === "transcribing"
        ? "Processing Speech..."
        : "Model is Listening...";

      ctx.font = "600 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = isModelSpeaking ? "#C8F135" : wsStatus === "thinking" ? "#f59e0b" : "#94a3b8";
      ctx.fillText(statusText, cx, h - 18);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [viewMode, isSpeaking, wsStatus, isModelSpeaking]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-700 bg-[#111927] shadow-xl ${className ?? ""}`}>
      {/* Mode Switcher Buttons (Clean Professional Typography) */}
      <div className="absolute top-3 right-3 z-30 flex gap-1 p-1 rounded-xl bg-[#0f172a]/80 backdrop-blur-md border border-gray-700">
        <button
          onClick={() => setViewMode("dual")}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            viewMode === "dual"
              ? "bg-[#C8F135] text-[#111927] shadow-sm"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Dual View
        </button>
        <button
          onClick={() => setViewMode("avatar")}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            viewMode === "avatar"
              ? "bg-[#C8F135] text-[#111927] shadow-sm"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Avatar
        </button>
        <button
          onClick={() => setViewMode("webcam")}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            viewMode === "webcam"
              ? "bg-[#C8F135] text-[#111927] shadow-sm"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Webcam
        </button>
      </div>

      {/* Main Display Area */}
      <div className="w-full h-[320px] relative overflow-hidden">
        {/* Avatar Canvas (visible in dual or avatar mode) */}
        {viewMode !== "webcam" && (
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />
        )}

        {/* Persistent Camera Video Element — NEVER unmounts, instant zero-lag mode transitions */}
        <div
          className={`transition-all duration-200 ease-out z-20 bg-black ${
            viewMode === "webcam"
              ? "absolute inset-0 w-full h-full"
              : viewMode === "dual"
              ? "absolute bottom-3 right-3 w-36 h-28 rounded-xl overflow-hidden border-2 border-[#C8F135]/80 shadow-2xl"
              : "hidden"
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              viewMode === "webcam" && isSpeaking ? "ring-4 ring-[#C8F135]" : ""
            }`}
            style={{ display: hasWebcam ? "block" : "none" }}
          />
          {!hasWebcam && (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 p-2 text-center">
              Camera Offline
            </div>
          )}
          {viewMode === "dual" && hasWebcam && (
            <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white backdrop-blur-sm">
              You (Candidate)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
