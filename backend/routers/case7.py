"""案例7：数字人直播智能导购路由"""
import json
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services import liveroom_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    current_product_id: Optional[str] = None
    conversation_history: List = Field(default_factory=list)


@router.get("/products")
async def get_products():
    """获取商品列表"""
    return {"products": liveroom_service.get_products()}


@router.get("/knowledge")
async def get_knowledge():
    """获取知识库预览"""
    return {"knowledge": liveroom_service.get_knowledge_preview()}


@router.post("/chat")
async def chat(request: ChatRequest):
    """数字人实时对话（流式输出）"""
    if not request.message.strip():
        return {"error": "消息不能为空"}

    async def event_stream():
        async for chunk in liveroom_service.chat_stream(
            user_message=request.message,
            current_product_id=request.current_product_id,
            conversation_history=request.conversation_history,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
