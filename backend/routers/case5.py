"""案例5：社交媒体舆情洞察路由"""
import json
from typing import List
from pydantic import BaseModel, Field
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services import sentiment_service

router = APIRouter()


class AnalyzeRequest(BaseModel):
    brand_name: str = "示例品牌"
    use_sample: bool = True
    custom_comments: List[str] = Field(default_factory=list)


@router.get("/sample-data")
async def get_sample_data():
    """获取模拟舆情数据集"""
    return sentiment_service.get_sample_data()


@router.post("/analyze")
async def analyze_sentiment(request: AnalyzeRequest):
    """情感分析与舆情洞察（流式输出）"""
    if request.use_sample:
        comments = [c["text"] for c in sentiment_service.get_sample_data()["comments"]]
    else:
        comments = request.custom_comments

    if not comments:
        comments = [c["text"] for c in sentiment_service.get_sample_data()["comments"]]

    async def event_stream():
        async for chunk in sentiment_service.analyze_sentiment_stream(
            comments=comments,
            brand_name=request.brand_name,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
