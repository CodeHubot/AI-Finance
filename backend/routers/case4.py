"""案例4：智能营销文案与创意生成系统路由"""
import json
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from services import copy_service

router = APIRouter()


class GenerateRequest(BaseModel):
    product_name: str
    selling_points: str
    target_audience: str
    platforms: List[str]
    extra_info: str = ""
    variants_per_platform: int = 2


@router.post("/generate")
async def generate_copy(request: GenerateRequest):
    """批量生成多平台营销文案（流式输出）"""
    if not request.product_name.strip():
        raise HTTPException(status_code=400, detail="产品名称不能为空")
    if not request.platforms:
        raise HTTPException(status_code=400, detail="至少选择一个平台")

    async def event_stream():
        async for chunk in copy_service.generate_copy_stream(
            product_name=request.product_name,
            selling_points=request.selling_points,
            target_audience=request.target_audience,
            platforms=request.platforms,
            extra_info=request.extra_info,
            variants_per_platform=request.variants_per_platform,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/platforms")
async def get_platforms():
    """获取支持的平台列表"""
    return {"platforms": copy_service.get_platforms()}
