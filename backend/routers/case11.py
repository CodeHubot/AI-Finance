"""案例11：智能教学设计助手"""
from __future__ import annotations
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.lesson_design_service import design_lesson_stream, get_sample_topics

router = APIRouter()


class LessonRequest(BaseModel):
    subject: str
    grade: str
    topic: str
    duration: int = 45
    objectives: Optional[str] = None
    class_description: Optional[str] = None


@router.get("/samples")
async def get_sample_topics_api():
    return get_sample_topics()


@router.post("/design")
async def design_lesson(req: LessonRequest):
    async def stream():
        async for event in design_lesson_stream(
            req.subject, req.grade, req.topic, req.duration,
            req.objectives or "", req.class_description or ""
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
