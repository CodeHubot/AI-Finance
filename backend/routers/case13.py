"""案例13：智慧课堂问答与知识检测"""
from __future__ import annotations
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.classroom_qa_service import (
    generate_questions_stream, analyze_answer_stream, get_subject_topics
)

router = APIRouter()


class QARequest(BaseModel):
    subject: str
    grade: str
    topic: str
    stage: str = "讲授中"


class AnswerAnalysisRequest(BaseModel):
    subject: str
    question: str
    student_answer: str
    correct_answer: str


@router.get("/topics")
async def list_topics():
    return get_subject_topics()


@router.post("/generate")
async def generate_questions(req: QARequest):
    async def stream():
        async for event in generate_questions_stream(
            req.subject, req.grade, req.topic, req.stage
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/analyze-answer")
async def analyze_student_answer(req: AnswerAnalysisRequest):
    async def stream():
        async for event in analyze_answer_stream(
            req.subject, req.question, req.student_answer, req.correct_answer
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
