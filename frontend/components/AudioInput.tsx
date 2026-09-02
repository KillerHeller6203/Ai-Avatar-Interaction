"use client";

import { useCallback, useRef, useEffect, useState } from "react";

interface AudioInputProps {
  onAudioChunk: (base64: string) => void;
  onUserBargeIn?: () => void;
  isSessionActive?: boolean;
  wsStatus?: string;
  isAiSpeaking?: boolean;
  disabled?: boolean;
}

export default function AudioInput({
  onAudioChunk,
  onUserBargeIn,
  isSessionActive,
  wsStatus,
  isAiSpeaking,
  disabled,
}: AudioInputProps) {
  const [recording, setRecording] = useState(false);
  const [volume, setVolume] = useState(0); // 0 to 100 decibel level
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const hasSpokenInTurnRef = useRef(false);
  const speechFrameCountRef = useRef(0);
  const silentFrameCountRef = useRef(0);

  const isTurnBlocked = disabled || wsStatus === "transcribing" || wsStatus === "thinking" || wsStatus === "speaking" || isAiSpeaking;

  // Clear recorded audio chunks whenever AI starts speaking or turn is processing
  useEffect(() => {
    if (isTurnBlocked) {
      recordedChunksRef.current = [];
      hasSpokenInTurnRef.current = false;
      speechFrameCountRef.current = 0;
      silentFrameCountRef.current = 0;
      setIsSpeaking(false);
    }
  }, [isTurnBlocked]);

  const restartMediaRecorder = useCallback(() => {
    if (!streamRef.current) return;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {}

    recordedChunksRef.current = [];
    hasSpokenInTurnRef.current = false;
    speechFrameCountRef.current = 0;
    silentFrameCountRef.current = 0;
    setIsSpeaking(false);

    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: "audio/webm;codecs=opus",
      });

      recorder.ondataavailable = (e) => {
        // IGNORE audio chunks when turn is blocked (AI is speaking / processing)
        if (!isTurnBlocked && e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("Failed to restart MediaRecorder:", err);
    }
  }, [isTurnBlocked]);

  const flushTurnAudio = useCallback(() => {
    if (isTurnBlocked || !hasSpokenInTurnRef.current) return;

    const chunks = [...recordedChunksRef.current];
    const currentRecorder = mediaRecorderRef.current;

    // Stop current recorder to finalize WebM EBML container header
    if (currentRecorder && currentRecorder.state !== "inactive") {
      try {
        currentRecorder.stop();
      } catch {}
    }

    recordedChunksRef.current = [];
    hasSpokenInTurnRef.current = false;
    speechFrameCountRef.current = 0;
    silentFrameCountRef.current = 0;

    if (chunks.length > 0) {
      const turnBlob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
      if (turnBlob.size > 400) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          if (base64) {
            onUserBargeIn?.();
            onAudioChunk(base64);
            onAudioChunk("__AUDIO_END__");
          }
        };
        reader.readAsDataURL(turnBlob);
      }
    }

    // Immediately restart a fresh MediaRecorder instance for the next turn
    setTimeout(() => {
      restartMediaRecorder();
    }, 150);
  }, [isTurnBlocked, onAudioChunk, onUserBargeIn, restartMediaRecorder]);

  // Keyboard Spacebar Shortcut to manual flush turn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isSessionActive && !isTurnBlocked && hasSpokenInTurnRef.current) {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";
        if (!isInput) {
          e.preventDefault();
          flushTurnAudio();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSessionActive, isTurnBlocked, flushTurnAudio]);

  const startRecording = useCallback(async () => {
    if (disabled || recording) return;

    try {
      // Enable Hardware Noise Suppression & Echo Cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Initialize Web Audio API Analyser
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setRecording(true);
      restartMediaRecorder();

      const checkVolume = () => {
        if (!streamRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Boost mic gain 4x so normal quiet speech registers easily at 20-50 dB without shouting
        const normalizedVol = Math.min(100, Math.round(((avg * 4.0) / 128) * 100));

        if (isTurnBlocked) {
          setVolume(0);
          setIsSpeaking(false);
          speechFrameCountRef.current = 0;
          silentFrameCountRef.current = 0;
          requestAnimationFrame(checkVolume);
          return;
        }

        setVolume(normalizedVol);

        // Ultra-Sensitive Speech VAD (>4 dB for 2+ consecutive frames ≈ 60ms of speech)
        if (normalizedVol > 4) {
          speechFrameCountRef.current += 1;
          silentFrameCountRef.current = 0;

          if (speechFrameCountRef.current >= 2) {
            setIsSpeaking(true);
            hasSpokenInTurnRef.current = true;
          }
        } else {
          speechFrameCountRef.current = 0;

          if (hasSpokenInTurnRef.current) {
            // Voice paused — count silent frames (~75 frames ≈ 2.2 seconds of true silence)
            silentFrameCountRef.current += 1;

            if (silentFrameCountRef.current > 75) {
              flushTurnAudio();
            }
          }
        }

        requestAnimationFrame(checkVolume);
      };

      requestAnimationFrame(checkVolume);
    } catch (err) {
      console.error("Microphone access failed:", err);
    }
  }, [disabled, recording, isTurnBlocked, flushTurnAudio, restartMediaRecorder]);

  const stopRecording = useCallback(() => {
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    recordedChunksRef.current = [];
    hasSpokenInTurnRef.current = false;
    speechFrameCountRef.current = 0;
    silentFrameCountRef.current = 0;
    setRecording(false);
    setIsSpeaking(false);
    setVolume(0);
  }, []);

  useEffect(() => {
    if (isSessionActive && !recording) {
      startRecording();
    } else if (!isSessionActive && recording) {
      stopRecording();
    }
  }, [isSessionActive, recording, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  if (!isSessionActive) return null;

  // 8 Dynamic Decibel Waveform Bars
  const bars = [0.6, 1.2, 0.8, 1.5, 1.1, 0.7, 1.3, 0.9];

  return (
    <div className="audio-input flex flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-[#111927] text-[#C8F135] border border-[#C8F135]/40 shadow-lg text-xs font-semibold tracking-wide">
        {/* Real-time Decibel Audio Equalizer Animation */}
        <div className="flex items-center gap-1 h-5">
          {bars.map((multiplier, i) => {
            const h = isSpeaking ? Math.max(4, Math.min(24, volume * multiplier * 0.4)) : 4;
            return (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${h}px`,
                  background: isSpeaking ? "#C8F135" : "rgba(200, 241, 53, 0.3)",
                  boxShadow: isSpeaking ? "0 0 8px #C8F135" : "none",
                }}
              />
            );
          })}
        </div>

        <span>
          {isTurnBlocked
            ? "AI Interviewer Speaking / Thinking..."
            : isSpeaking
            ? `Recording Voice (${volume} dB) — Speaking...`
            : "Hands-Free Mic Active — Automatic Silence Detection"}
        </span>

        {/* Manual Send Response Button when candidate has spoken and turn is open */}
        {!isTurnBlocked && hasSpokenInTurnRef.current && (
          <button
            onClick={flushTurnAudio}
            className="ml-2 px-3 py-1 bg-[#C8F135] text-[#111927] rounded-full text-xs font-bold shadow-md hover:scale-105 transition-all"
          >
            Send Response (Space) ↵
          </button>
        )}
      </div>
    </div>
  );
}
