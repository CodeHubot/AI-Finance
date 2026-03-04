import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import case1, case2, case3

load_dotenv()

app = FastAPI(
    title="AI 金融案例教学平台 - API",
    description="支持三个 AI 金融教学案例的后端服务",
    version="1.0.0",
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


@app.get("/")
async def root():
    return {
        "message": "AI 金融案例教学平台 API 运行正常",
        "cases": [
            {"id": 1, "name": "智能金融问答助手", "path": "/api/case1"},
            {"id": 2, "name": "金融数据分析实战", "path": "/api/case2"},
            {"id": 3, "name": "投研全流程实践", "path": "/api/case3"},
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
