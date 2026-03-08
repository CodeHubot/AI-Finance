"""案例8：营销数据分析与决策智能体路由"""
from __future__ import annotations
import json
from pydantic import BaseModel
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services import marketing_analytics_service

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


@router.get("/dashboard")
async def get_dashboard():
    """获取营销看板概览数据"""
    return marketing_analytics_service.get_dashboard_data()


@router.get("/example-queries")
async def get_example_queries():
    """获取示例查询"""
    return {"queries": marketing_analytics_service.get_example_queries()}


@router.post("/query")
async def query(request: QueryRequest):
    """自然语言查询营销数据（流式输出）"""
    if not request.question.strip():
        return {"error": "查询问题不能为空"}

    async def event_stream():
        async for chunk in marketing_analytics_service.query_stream(
            question=request.question,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
