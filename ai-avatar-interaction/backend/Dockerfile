# Production Dockerfile for FastAPI AI Interviewer Backend
FROM python:3.11-slim

# Install system dependencies (ffmpeg for Whisper audio parsing)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port (Render automatically sets $PORT)
EXPOSE 8000

# Start Uvicorn server binding to 0.0.0.0 and dynamic $PORT
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
