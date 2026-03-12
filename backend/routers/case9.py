"""案例9：智能作业批改与个性化反馈"""
from __future__ import annotations
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.homework_service import grade_homework_stream, get_config, get_sample

router = APIRouter()


class GradeRequest(BaseModel):
    subject: str
    grade: str
    assignment_type: str
    title: str
    content: str


@router.get("/config")
async def get_homework_config():
    return get_config()


@router.get("/sample/{index}")
async def get_sample_work(index: int = 0):
    return get_sample(index)


@router.post("/grade")
async def grade_homework(req: GradeRequest):
    async def generate():
        async for event in grade_homework_stream(
            req.subject, req.grade, req.assignment_type, req.title, req.content
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
