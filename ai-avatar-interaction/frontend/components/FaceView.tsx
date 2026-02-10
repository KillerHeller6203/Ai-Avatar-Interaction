"use client";

import { useRef, useEffect, useState } from "react";

/**
 * Face representation: User's real webcam feed via <video>.
 * Always render the <video> element to avoid metadata deadlock.
 */
interface FaceViewProps {
  isSpeaking?: boolean;
  className?: string;
}

export default function FaceView({ isSpeaking, className }: FaceViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setHasWebcam(true);
          };
        }
      } catch (err) {
        setError("Webcam unavailable");
        setHasWebcam(false);
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className={`face-view ${className ?? ""}`}>
      <div className="video-wrapper">
        {/* ALWAYS render video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={isSpeaking ? "speaking" : ""}
          style={{ display: hasWebcam ? "block" : "none" }}
        />

        {/* Placeholder while camera initializes */}
        {!hasWebcam && (
          <div className="face-placeholder">
            {error ?? "Starting camera…"}
          </div>
        )}

        {/* Speaking indicator */}
        {isSpeaking && hasWebcam && (
          <span className="speaking-indicator">Speaking</span>
        )}
      </div>
    </div>
  );
}
