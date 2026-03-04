"""案例1：智能金融问答助手路由"""
import json
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import rag_service

router = APIRouter()

DEFAULT_SYSTEM_PROMPT = """你是一名专业的金融顾问助手，拥有丰富的金融市场、投资理论和监管政策知识。

你的职责：
1. 基于提供的金融知识库内容准确回答问题
2. 当知识库中没有相关信息时，运用专业金融知识回答
3. 保持客观中立，对于投资建议需注明风险
4. 回答要专业、清晰、有条理

请用中文回答所有问题。"""


class ChatRequest(BaseModel):
    question: str
    system_prompt: Optional[str] = DEFAULT_SYSTEM_PROMPT
    top_k: Optional[int] = 4


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """上传金融文档到知识库"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    suffix = file.filename.lower().split(".")[-1]
    if suffix not in ["pdf", "txt", "md"]:
        raise HTTPException(status_code=400, detail="仅支持 PDF、TXT、MD 格式")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过 10MB")

    result = await rag_service.upload_document(content, file.filename)
    return {"success": True, "document": result}


@router.get("/documents")
async def list_documents():
    """获取知识库文档列表"""
    docs = rag_service.list_documents()
    return {"documents": docs, "total": len(docs)}


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """删除知识库文档"""
    success = rag_service.delete_document(doc_id)
    return {"success": success}


@router.post("/chat")
async def chat(request: ChatRequest):
    """RAG 问答接口（流式输出）"""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="问题不能为空")

    async def event_stream():
        async for chunk in rag_service.chat_with_rag(
            question=request.question,
            system_prompt=request.system_prompt or DEFAULT_SYSTEM_PROMPT,
            top_k=request.top_k or 4,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/default-prompt")
async def get_default_prompt():
    return {"prompt": DEFAULT_SYSTEM_PROMPT}
