"""案例6：智能推荐与用户分层路由"""
import json
from typing import List
from pydantic import BaseModel, Field
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services import recommendation_service

router = APIRouter()


class RecommendRequest(BaseModel):
    user_id: str
    product_ids: List[str] = Field(default_factory=list)


@router.get("/users")
async def get_users():
    """获取模拟用户列表"""
    return {"users": recommendation_service.get_users()}


@router.get("/products")
async def get_products():
    """获取模拟商品列表"""
    return {"products": recommendation_service.get_products()}


@router.get("/segments")
async def get_segments():
    """获取用户分层结果"""
    segments = await recommendation_service.get_user_segments()
    return {"segments": segments}


@router.post("/recommend")
async def recommend(request: RecommendRequest):
    """生成个性化推荐对比（流式输出）"""
    async def event_stream():
        async for chunk in recommendation_service.batch_recommend_stream(
            user_id=request.user_id,
            product_ids=request.product_ids,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
