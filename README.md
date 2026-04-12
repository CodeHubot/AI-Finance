# AI 金融案例教学展示平台

大模型赋能金融业务实战 — 三大核心教学案例，一站式体验。

## 案例概览

| 案例 | 名称 | 核心技术 | 难度 |
|------|------|----------|------|
| 案例1 | 智能金融问答助手 | LangChain + RAG + ChromaDB | 进阶 |
| 案例2 | 金融数据分析实战 | NL分析 + ECharts + 报告生成 | 基础 |
| 案例3 | 投研全流程实践 | 产业链分析 + 评分模型 + 报告 | 综合 |

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 LLM API Key
```

支持三种大模型提供商（在 `.env` 中设置 `LLM_PROVIDER`）：
- `openai`：OpenAI GPT 系列
- `deepseek`：DeepSeek（推荐，性价比高）
- `tongyi`：通义千问（阿里云）

### 2. Docker 一键启动（推荐）

```bash
docker compose up --build -d
```

访问：
- 前端：http://localhost:28499

> 后端服务运行在容器内网，不对外暴露端口。浏览器的所有 `/api/*` 请求由 Next.js 服务器自动代理转发到后端，无需额外配置。

**国内服务器首次构建加速说明**

Dockerfile 已内置阿里云镜像（apt / pip / npm），通常无需额外操作。若拉取基础镜像（`node:20-alpine` / `python:3.11-slim`）仍较慢，可配置 Docker Hub 镜像：

```json
// /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://hub-mirror.c.163.com"
  ]
}
```

```bash
systemctl restart docker
```

### 3. 本地开发启动

#### 后端

```bash
cd backend
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# 生成模拟金融数据（首次运行）
python data/generate_mock_data.py

# 启动服务
python main.py
```

#### 前端

```bash
cd frontend
npm install --registry=https://registry.npmmirror.com
npm run dev
```

本地开发时，Next.js dev server 会自动将 `/api/*` 请求代理到 `BACKEND_URL`（默认 `http://localhost:8000`），无需在 `.env` 中设置 `NEXT_PUBLIC_API_BASE_URL`。

## 技术架构

```
浏览器
    ↓ HTTP / SSE（端口 28499）
前端容器 (Next.js 14 + TailwindCSS + ECharts)
    ↓ /api/* rewrites 代理（容器内网，不对外暴露）
后端容器 (Python FastAPI，端口 8000 仅内网)
    ├── 案例1：LangChain + ChromaDB (RAG)
    ├── 案例2：Pandas + 金融模拟数据
    └── 案例3：LLM 投研分析引擎
    ↓
大模型 API (OpenAI / DeepSeek / 通义千问)
```

## 案例详解

### 案例1：智能金融问答助手

**学习要点**
1. 金融文档上传与智能分块
2. 文本向量化与 ChromaDB 存储
3. 系统提示词工程设计与调试
4. RAG 检索增强生成流程
5. 流式输出与来源引用展示

**核心文件**
- `backend/services/rag_service.py` — RAG 核心逻辑
- `frontend/app/case1/page.tsx` — 对话界面

### 案例2：金融数据分析实战

**学习要点**
1. 自然语言意图解析
2. 金融数据全生命周期处理
3. ECharts 动态图表生成
4. AI 驱动的分析报告撰写

**核心文件**
- `backend/services/analysis_service.py` — 数据分析逻辑
- `backend/data/` — 内置 A 股模拟数据
- `frontend/app/case2/page.tsx` — 分析界面

### 案例3：投研全流程实践

**学习要点**
1. 产业链图谱结构化生成
2. 多源信息（公告/研报/舆情）聚合
3. AI 驱动的多维度企业评分模型
4. 标准化投研报告一键生成

**核心文件**
- `backend/services/research_service.py` — 投研分析逻辑
- `frontend/app/case3/page.tsx` — 投研仪表盘

## 项目结构

```
AI-Finance/
├── frontend/                  # Next.js 前端
│   ├── app/
│   │   ├── page.tsx           # 门户首页
│   │   ├── case1/page.tsx     # 案例1：问答助手
│   │   ├── case2/page.tsx     # 案例2：数据分析
│   │   └── case3/page.tsx     # 案例3：投研平台
│   └── lib/api.ts             # API 接口封装
├── backend/                   # FastAPI 后端
│   ├── main.py                # 主入口
│   ├── routers/               # 路由层
│   ├── services/              # 业务逻辑层
│   │   ├── rag_service.py
│   │   ├── analysis_service.py
│   │   └── research_service.py
│   └── data/                  # 数据目录
├── docker-compose.yml
└── .env.example
```

## 注意事项

- 所有 AI 生成内容仅供教学参考，不构成真实投资建议
- 案例2 使用模拟股票数据，不代表真实市场行情
- 建议使用 DeepSeek API（性价比高，适合教学场景）
