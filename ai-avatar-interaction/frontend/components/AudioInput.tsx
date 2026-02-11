"use client";

import { useCallback, useRef, useState } from "react";

interface AudioInputProps {
  onAudioChunk: (base64: string) => void;
  disabled?: boolean;
}

export default function AudioInput({ onAudioChunk, disabled }: AudioInputProps) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (disabled || recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // recorder.onstop = async () => {
      //   const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      //   const buffer = await blob.arrayBuffer();
      //   // @ts-ignore
      //   const base64 = btoa(
      //     String.fromCharCode(...new Uint8Array(buffer))
      //   );
      //   onAudioChunk(base64);
      //   chunksRef.current = [];
      // };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          if (!base64) return;

          onAudioChunk(base64);
          onAudioChunk("__AUDIO_END__");
        };
        reader.readAsDataURL(blob);
        chunksRef.current = [];
      };



      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error("Mic access failed:", err);
    }
  }, [disabled, recording, onAudioChunk]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    setRecording(false);
  }, []);

  return (
    <div className="audio-input">
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        className={recording ? "recording" : ""}
      >
        {recording ? "Stop mic" : "Start mic"}
      </button>
    </div>
  );
}
