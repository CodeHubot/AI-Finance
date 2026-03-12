"""案例10：个性化学习路径规划"""
from __future__ import annotations
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from services.learning_path_service import generate_path_stream, get_subjects

router = APIRouter()


class PathRequest(BaseModel):
    subject: str
    current_level: str
    weak_topics: List[str]
    goal: str
    hours_per_week: int = 10
    weeks: int = 12


@router.get("/subjects")
async def get_subject_config():
    return get_subjects()


@router.post("/generate")
async def generate_path(req: PathRequest):
    async def stream():
        async for event in generate_path_stream(
            req.subject, req.current_level, req.weak_topics,
            req.goal, req.hours_per_week, req.weeks
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
