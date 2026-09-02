"use client";
import { useEffect, useState } from "react";

interface ATSScoreRingProps {
  score: number;
  explanation: string;
}

export default function ATSScoreRing({ score, explanation }: ATSScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return "#16a34a";
    if (s >= 50) return "#b45309";
    return "#dc2626";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 65) return "Good";
    if (s >= 50) return "Fair";
    return "Needs Work";
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="10"
          />
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring"
            style={{ transformOrigin: "70px 70px" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color }}>
            {score}
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-2"
          style={{ background: `${color}20`, color }}
        >
          {getLabel(score)}
        </span>
        <p className="text-sm max-w-xs text-center" style={{ color: "var(--muted)" }}>
          {explanation}
        </p>
      </div>
    </div>
  );
}
