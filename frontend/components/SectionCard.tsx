"use client";

import { useState } from "react";
import { ResumeSection, SectionStatus } from "@/types";

const STATUS_CONFIG: Record<
  SectionStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  good: {
    label: "Looks Good",
    bg: "var(--green-light)",
    text: "var(--green)",
    dot: "var(--green)",
  },
  needs_improvement: {
    label: "Needs Work",
    bg: "var(--amber-light)",
    text: "var(--amber)",
    dot: "var(--amber)",
  },
  critical: {
    label: "Critical",
    bg: "var(--red-light)",
    text: "var(--red)",
    dot: "var(--red)",
  },
};

interface SectionCardProps {
  section: ResumeSection;
  index: number;
}

export default function SectionCard({ section, index }: SectionCardProps) {
  const [showExample, setShowExample] = useState(false);
  const config = STATUS_CONFIG[section.status] || STATUS_CONFIG.good;

  return (
    <div
      className="p-5 animate-fade-in"
      style={{
        background: "#ffffff",
        border: "1px solid var(--border)",
        borderRadius: "1.25rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        animationDelay: `${index * 0.07}s`,
        animationFillMode: "both",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
        >
          {section.name}
        </h3>
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1"
          style={{
            background: config.bg,
            color: config.text,
            borderRadius: "999px",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: config.dot }}
          />
          {config.label}
        </span>
      </div>

      {/* Strengths */}
      {section.strengths && section.strengths.length > 0 && (
        <div className="mb-3">
          <p
            className="text-xs font-medium mb-2 uppercase tracking-widest"
            style={{ color: "var(--green)" }}
          >
            ✓ Strengths
          </p>
          <ul className="space-y-1">
            {section.strengths.map((s, i) => (
              <li
                key={i}
                className="text-sm flex gap-2"
                style={{ color: "var(--muted)" }}
              >
                <span style={{ color: "var(--green)", flexShrink: 0 }}>·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {section.improvements && section.improvements.length > 0 && (
        <div className="mb-3">
          <p
            className="text-xs font-medium mb-2 uppercase tracking-widest"
            style={{ color: "#84cc16" }}
          >
            ↑ Improvements
          </p>
          <ul className="space-y-1">
            {section.improvements.map((imp, i) => (
              <li
                key={i}
                className="text-sm flex gap-2"
                style={{ color: "var(--muted)" }}
              >
                <span style={{ color: "#84cc16", flexShrink: 0 }}>·</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rewritten example */}
      {section.rewritten_example && (
        <div>
          <button
            onClick={() => setShowExample(!showExample)}
            className="text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--gold)" }}
          >
            {showExample ? "Hide" : "Show"} rewrite example →
          </button>
          {showExample && (
            <div
              className="mt-2 p-3 rounded-lg text-sm animate-fade-in"
              style={{
                background: "var(--gold-light)",
                color: "var(--amber)",
                borderLeft: "3px solid var(--gold)",
              }}
            >
              {section.rewritten_example}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
