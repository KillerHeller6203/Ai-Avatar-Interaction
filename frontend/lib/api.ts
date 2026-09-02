import { AnalysisResult } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function analyzeResumeText(text: string, jobRole?: string, experienceLevel?: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: text, job_role: jobRole || "", experience_level: experienceLevel || "" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function analyzeResumePDF(file: File, jobRole?: string, experienceLevel?: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (jobRole) formData.append("job_role", jobRole);
  if (experienceLevel) formData.append("experience_level", experienceLevel);

  const res = await fetch(`${API_URL}/analyze/pdf`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}
