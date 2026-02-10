"use client";

import { useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from "react";

/**
 * Plays received TTS audio chunks via Web Audio API.
 * Queues chunks and plays as they arrive for low-latency feel.
 */
export interface AudioOutputHandle {
  playChunk: (base64: string) => void;
}

const AudioOutput = forwardRef<AudioOutputHandle>((_, ref) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);

  const initContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  }, []);

  const processQueue = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return;
    playingRef.current = true;
    const ctx = initContext();
    while (queueRef.current.length > 0) {
      const base64 = queueRef.current.shift()!;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      try {
        const ab = await ctx.decodeAudioData(buffer);
        const src = ctx.createBufferSource();
        src.buffer = ab;
        src.connect(ctx.destination);
        await new Promise<void>((res) => {
          src.onended = () => res();
          src.start(0);
        });
      } catch {
        // Skip invalid chunks (e.g. partial)
      }
    }
    playingRef.current = false;
  }, [initContext]);

  const playChunk = useCallback(
    (base64: string) => {
      if (!base64) return;
      queueRef.current.push(base64);
      processQueue();
    },
    [processQueue]
  );

  useImperativeHandle(ref, () => ({ playChunk }), [playChunk]);

  return null;
});

AudioOutput.displayName = "AudioOutput";
export default AudioOutput;
