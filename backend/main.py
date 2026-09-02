"""
AI Avatar Interaction & Resume Enhancer - FastAPI Backend
Entry point for the voice + AI + face interaction and resume analysis system.
"""
from fastapi import FastAPI, WebSocket, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from websocket import handle_websocket
from resume_analyzer import extract_text_from_pdf, analyze_resume
from interview_evaluator import evaluate_interview_session

app = FastAPI(
    title="AI Avatar Interaction & Resume Enhancer",
    description="Real-time voice + LLM + TTS pipeline & Resume ATS Evaluation API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResumeTextRequest(BaseModel):
    resume_text: str
    job_role: str = ""
    experience_level: str = ""


class InterviewEvaluationRequest(BaseModel):
    transcript: list
    job_role: str = ""
    interview_type: str = "general"


@app.post("/interview/evaluate")
def evaluate_interview(request: InterviewEvaluationRequest):
    return evaluate_interview_session(request.transcript, request.job_role, request.interview_type)


@app.get("/")
async def root():
    return {
        "service": "AI Avatar Interaction & Resume Enhancer API",
        "status": "ok",
        "ws": "/ws",
    }


@app.post("/analyze/text")
def analyze_text(request: ResumeTextRequest):
    return analyze_resume(request.resume_text, request.job_role, request.experience_level)


@app.post("/analyze/pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    job_role: str = Form(""),
    experience_level: str = Form("")
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit.")

    try:
        resume_text = extract_text_from_pdf(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF. The file may be scanned or image-based.")

    result = analyze_resume(resume_text, job_role, experience_level)
    result["extracted_text"] = resume_text
    return result


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await handle_websocket(websocket)


if __name__ == "__main__":
    import uvicorn
    from config import WS_HOST, WS_PORT
    uvicorn.run(app, host=WS_HOST, port=WS_PORT)
