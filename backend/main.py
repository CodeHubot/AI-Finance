import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import case1, case2, case3, case4, case5, case6, case7, case8
from routers import case9, case10, case11, case12, case13

load_dotenv()

app = FastAPI(
    title="AI 教学案例平台 - API",
    description="支持金融+互联网营销+教育共13个 AI 教学案例的后端服务",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(case1.router, prefix="/api/case1", tags=["案例1 - 金融问答助手"])
app.include_router(case2.router, prefix="/api/case2", tags=["案例2 - 金融数据分析"])
app.include_router(case3.router, prefix="/api/case3", tags=["案例3 - 投研全流程"])
app.include_router(case4.router, prefix="/api/case4", tags=["案例4 - 营销文案生成"])
app.include_router(case5.router, prefix="/api/case5", tags=["案例5 - 舆情洞察"])
app.include_router(case6.router, prefix="/api/case6", tags=["案例6 - 智能推荐"])
app.include_router(case7.router, prefix="/api/case7", tags=["案例7 - 数字人导购"])
app.include_router(case8.router, prefix="/api/case8", tags=["案例8 - 营销决策智能体"])
app.include_router(case9.router, prefix="/api/case9", tags=["案例9 - 智能作业批改"])
app.include_router(case10.router, prefix="/api/case10", tags=["案例10 - 个性化学习路径"])
app.include_router(case11.router, prefix="/api/case11", tags=["案例11 - 智能教学设计"])
app.include_router(case12.router, prefix="/api/case12", tags=["案例12 - 学术研究助手"])
app.include_router(case13.router, prefix="/api/case13", tags=["案例13 - 智慧课堂问答"])


@app.get("/")
async def root():
    return {
        "message": "AI 教学案例平台 API 运行正常",
        "cases": [
            {"id": 1, "name": "智能金融问答助手", "path": "/api/case1"},
            {"id": 2, "name": "金融数据分析实战", "path": "/api/case2"},
            {"id": 3, "name": "投研全流程实践", "path": "/api/case3"},
            {"id": 4, "name": "智能营销文案生成", "path": "/api/case4"},
            {"id": 5, "name": "社交媒体舆情洞察", "path": "/api/case5"},
            {"id": 6, "name": "智能推荐与用户分层", "path": "/api/case6"},
            {"id": 7, "name": "数字人直播导购助手", "path": "/api/case7"},
            {"id": 8, "name": "营销数据决策智能体", "path": "/api/case8"},
            {"id": 9, "name": "智能作业批改系统", "path": "/api/case9"},
            {"id": 10, "name": "个性化学习路径规划", "path": "/api/case10"},
            {"id": 11, "name": "智能教学设计助手", "path": "/api/case11"},
            {"id": 12, "name": "高校学术研究助手", "path": "/api/case12"},
            {"id": 13, "name": "智慧课堂问答系统", "path": "/api/case13"},
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("BACKEND_HOST", "0.0.0.0"),
        port=int(os.getenv("BACKEND_PORT", 8000)),
        reload=True,
    )
