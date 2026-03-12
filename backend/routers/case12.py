"""案例12：高校学术研究助手"""
from __future__ import annotations
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.academic_research_service import (
    analyze_research_stream, check_writing_stream,
    get_research_directions, get_sample_abstracts,
)

router = APIRouter()


class ResearchRequest(BaseModel):
    topic: str
    research_question: Optional[str] = None
    direction: str
    abstracts: Optional[str] = None


class WritingCheckRequest(BaseModel):
    text: str
    paper_type: str = "学术论文"


@router.get("/directions")
async def list_directions():
    return {"directions": get_research_directions()}


@router.get("/sample-abstracts")
async def sample_abstracts():
    return {"abstracts": get_sample_abstracts()}


@router.post("/analyze")
async def analyze_research(req: ResearchRequest):
    async def stream():
        async for event in analyze_research_stream(
            req.topic, req.research_question or "", req.direction, req.abstracts or ""
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/check-writing")
async def check_writing(req: WritingCheckRequest):
    async def stream():
        async for event in check_writing_stream(req.text, req.paper_type):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
