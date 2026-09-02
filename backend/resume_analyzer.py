"""
Resume Analyzer module for AI Avatar Interaction + Resume Enhancer.
Extracts PDF text and performs AI-driven ATS evaluation using Gemini or local Ollama.
"""
import io
import json
import os
from typing import Dict, Any
from fastapi import HTTPException
from dotenv import load_dotenv
import google.generativeai as genai
import pdfplumber

load_dotenv()

SYSTEM_PROMPT = """You are an expert resume coach and ATS optimization specialist with 15+ years of experience in HR and recruiting across top tech companies. Your goal is to provide thorough, actionable resume improvement suggestions.

Analyze the provided resume and return a JSON response with the following structure:
{
  "ats_score": <number 0-100>,
  "ats_score_explanation": "<brief explanation of the score>",
  "overall_summary": "<2-3 sentence overall assessment>",
  "sections": [
    {
      "name": "<section name like Summary, Experience, Skills, Education, Formatting, Language>",
      "status": "<'good' | 'needs_improvement' | 'critical'>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "improvements": ["<improvement 1>", "<improvement 2>"],
      "rewritten_example": "<optional: a rewritten version of a key bullet/section to demonstrate improvement>"
    }
  ],
  "quick_wins": ["<top 3-5 highest impact quick changes the person can make>"],
  "keywords_missing": ["<important industry keywords that seem to be missing>"],
  "ats_improvements": ["<specific action to raise the ATS score, e.g. add more keywords from job description>", "<format suggestion>", "<section restructuring tip>"]
}

Be specific and actionable. Reference actual content from the resume. Avoid generic advice. Focus on impact, quantification, ATS compatibility, and strong action verbs."""


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def analyze_resume(resume_text: str, job_role: str = "", experience_level: str = "") -> Dict[str, Any]:
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text is too short. Please provide more content.")

    role_context = f"The candidate is targeting a **{job_role}** role." if job_role else "The candidate has not specified a target role. Infer it from the resume content."

    level_context = ""
    if experience_level:
        level_map = {
            "student": "They are a student with no professional experience. Focus on projects, academics, internships, and potential.",
            "fresher": "They are a fresher with 0–1 years of experience. Focus on internships, projects, and foundational skills.",
            "junior": "They have 1–3 years of experience. Evaluate growth trajectory, skill depth, and early impact.",
            "mid": "They have 3–6 years of experience. Evaluate leadership hints, ownership, measurable impact, and technical depth.",
            "senior": "They have 6–10 years of experience. Evaluate strategic thinking, system design, mentorship, and business impact.",
            "lead": "They are a lead or principal engineer with 10+ years. Evaluate organizational impact, architecture decisions, cross-team influence, and thought leadership.",
        }
        level_context = level_map.get(experience_level, "")

    ats_instruction = f"\n\nIMPORTANT: Weight the ATS score specifically for target role: '{job_role}' and experience level: '{experience_level}'."

    dynamic_prompt = SYSTEM_PROMPT + f"\n\n{role_context}" + (f"\n\n{level_context}" if level_context else "") + ats_instruction

    api_key = os.getenv("GEMINI_API_KEY", "")
    response_text = ""

    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                "gemini-2.5-flash",
                generation_config={"response_mime_type": "application/json"},
            )
            response = model.generate_content(
                contents=f"{dynamic_prompt}\n\nHere is the resume:\n\n{resume_text}"
            )
            response_text = response.text
        except Exception as e:
            api_key = ""  # Fallback to Ollama if Gemini call fails

    if not api_key or not response_text:
        # Fallback to local Ollama
        import httpx
        from config import OLLAMA_BASE_URL, OLLAMA_MODEL
        try:
            with httpx.Client(timeout=60.0) as client:
                res = client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": dynamic_prompt},
                            {"role": "user", "content": f"Here is the resume:\n\n{resume_text}"}
                        ],
                        "format": "json",
                        "stream": False
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("message", {}).get("content", "")
                else:
                    raise HTTPException(status_code=500, detail=f"Ollama error status: {res.status_code}")
        except Exception as err:
            raise HTTPException(status_code=500, detail=f"LLM Error (Gemini/Ollama): {str(err)}")

    try:
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()

        return json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")
