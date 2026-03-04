"""案例3：投研全流程路由"""
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import research_service

router = APIRouter()


class ResearchRequest(BaseModel):
    company: str


@router.post("/industry-chain")
async def get_industry_chain(request: ResearchRequest):
    """获取产业链图谱数据"""
    if not request.company.strip():
        raise HTTPException(status_code=400, detail="公司名称不能为空")
    data = await research_service.generate_industry_chain(request.company)
    return data


@router.post("/info-summary")
async def get_info_summary(request: ResearchRequest):
    """获取多源信息摘要"""
    if not request.company.strip():
        raise HTTPException(status_code=400, detail="公司名称不能为空")
    data = await research_service.generate_info_summary(request.company)
    return data


@router.post("/score")
async def get_company_score(request: ResearchRequest):
    """获取企业评分数据"""
    if not request.company.strip():
        raise HTTPException(status_code=400, detail="公司名称不能为空")
    data = await research_service.generate_company_score(request.company)
    return data


class FullResearchRequest(BaseModel):
    company: str
    industry_chain: dict
    summary: dict
    score: dict


@router.post("/report")
async def generate_report(request: FullResearchRequest):
    """生成完整投研报告（流式输出）"""
    if not request.company.strip():
        raise HTTPException(status_code=400, detail="公司名称不能为空")

    async def event_stream():
        async for token in research_service.generate_research_report(
            company=request.company,
            industry_chain=request.industry_chain,
            summary=request.summary,
            score=request.score,
        ):
            yield f"data: {json.dumps({'token': token}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/sample-companies")
async def get_sample_companies():
    """返回示例公司列表"""
    return {
        "companies": [
            "贵州茅台", "宁德时代", "中国平安",
            "招商银行", "比亚迪", "中信证券",
            "东方财富", "海天味业", "工商银行",
        ]
    }
