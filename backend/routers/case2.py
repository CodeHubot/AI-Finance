"""案例2：金融数据分析路由"""
import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import analysis_service

router = APIRouter()


class AnalyzeRequest(BaseModel):
    query: str
    custom_prompts: Optional[dict] = None


@router.get("/stocks")
async def get_stocks():
    """获取可分析的股票列表"""
    return {"stocks": analysis_service.get_available_stocks()}


@router.get("/prompt-templates")
async def get_prompt_templates():
    """获取案例2提示词模板"""
    return analysis_service.get_prompt_templates()


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """自然语言金融分析（流式输出图表+报告）"""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="查询内容不能为空")

    async def event_stream():
        async for chunk in analysis_service.analyze_with_nl(
            request.query, request.custom_prompts
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


@router.get("/data/{symbol}")
async def get_stock_data(symbol: str, data_type: str = "price"):
    """获取特定股票数据"""
    df = analysis_service.load_stock_data(symbol, data_type)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"股票 {symbol} 的 {data_type} 数据不存在")
    return {"symbol": symbol, "data_type": data_type, "data": df.to_dict(orient="records")}


@router.get("/example-queries")
async def get_example_queries():
    """返回示例查询"""
    return {
        "queries": [
            "分析贵州茅台近三年的营收增长趋势",
            "对比招商银行和工商银行的盈利能力",
            "分析新能源板块（宁德时代、比亚迪）的市场表现",
            "哪些股票的市盈率最低，具有估值优势？",
            "分析中国平安的投资价值",
        ]
    }
