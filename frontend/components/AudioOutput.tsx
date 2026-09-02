"use client";

import { useCallback, useRef, useImperativeHandle, forwardRef } from "react";

/**
 * Plays received TTS audio chunks via Web Audio API with low-latency queuing and instant interruption (barge-in) support.
 */
export interface AudioOutputHandle {
  playChunk: (base64: string) => void;
  stopAll: () => void;
  initContext: () => AudioContext;
}

interface AudioOutputProps {
  onSpeakingChange?: (speaking: boolean) => void;
}

const AudioOutput = forwardRef<AudioOutputHandle, AudioOutputProps>(({ onSpeakingChange }, ref) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const initContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new Ctx();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  }, []);

  const stopAll = useCallback(() => {
    queueRef.current = [];
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {}
      currentSourceRef.current = null;
    }
    playingRef.current = false;
    onSpeakingChange?.(false);
  }, [onSpeakingChange]);

  const processQueue = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return;
    playingRef.current = true;
    onSpeakingChange?.(true);
    const ctx = initContext();

    while (queueRef.current.length > 0) {
      const base64 = queueRef.current.shift()!;
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const buffer = bytes.buffer.slice(0);

        const ab = await ctx.decodeAudioData(buffer);
        const src = ctx.createBufferSource();
        currentSourceRef.current = src;
        src.buffer = ab;
        src.connect(ctx.destination);

        await new Promise<void>((res) => {
          src.onended = () => {
            currentSourceRef.current = null;
            res();
          };
          src.start(0);
        });
      } catch (err) {
        console.error("Audio output decode error:", err);
      }
    }

    playingRef.current = false;
    onSpeakingChange?.(false);
  }, [initContext, onSpeakingChange]);

  const playChunk = useCallback(
    (base64: string) => {
      if (!base64) return;
      queueRef.current.push(base64);
      processQueue();
    },
    [processQueue]
  );

  useImperativeHandle(ref, () => ({ playChunk, stopAll, initContext }), [playChunk, stopAll, initContext]);

  return null;
});

AudioOutput.displayName = "AudioOutput";
export default AudioOutput;
