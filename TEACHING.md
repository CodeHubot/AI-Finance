# 大模型赋能金融业务 — 授课材料

> **授课定位**：技术应用导向，面向有编程基础的学生
> **核心主线**：学会用大模型 API + 工程化思路解决金融场景的真实问题
> **不需要**：金融专业知识（金融概念遇到时简单解释即可）

---

## 课前准备（学生）

```bash
# 克隆项目
git clone <仓库地址>
cd AI-Finance

# 配置 API Key（选一个）
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY

# 启动后端
cd backend
pip install -r requirements.txt
python data/generate_mock_data.py
python main.py

# 新终端启动前端
cd frontend
npm install && npm run dev
```

浏览器打开 `http://localhost:3000`，三个案例全部可用。

---

# 第一讲：为什么金融行业需要大模型

## 1.1 金融数据的特点

从技术视角看，金融行业的数据有三个特点：

| 特点 | 描述 | 技术挑战 |
|------|------|---------|
| **非结构化比例高** | 研报、公告、新闻占比 >70% | 传统关键词检索失效 |
| **时效性强** | 市场信息分钟级更新 | 模型知识截止有滞后 |
| **专业术语密集** | 监管文件、合同条款语义复杂 | 通用 NLP 理解不够准 |

**大模型解决了什么**：自然语言理解 + 知识推理能力，让非结构化信息可以被查询、分析、生成。

## 1.2 金融 AI 应用的技术分层

```
┌─────────────────────────────────────────────┐
│  应用层  │  问答助手 / 数据分析 / 投研报告生成  │
├─────────────────────────────────────────────┤
│  增强层  │  RAG检索 / Function Calling / Agent │
├─────────────────────────────────────────────┤
│  模型层  │  OpenAI / DeepSeek / 通义千问       │
├─────────────────────────────────────────────┤
│  数据层  │  向量库 / 结构化数据库 / 实时数据流  │
└─────────────────────────────────────────────┘
```

> **讲课重点**：我们课程覆盖全部四层，从数据到应用完整走通。

---

# 案例一：智能金融问答助手

**技术关键词**：RAG、向量数据库、提示词工程、流式输出

## 2.1 核心问题：为什么不能直接问 ChatGPT？

**痛点演示**（在系统中直接提问）：

- 问：「XX 基金 2024 年三季度持仓情况如何？」
- 问：「公司内部风控手册第 12 条规定是什么？」

大模型的知识有截止日期，且不知道你的私有数据。

**解决方案：RAG（检索增强生成）**

```
用户提问
  ↓
① 问题向量化（Embedding）
  ↓
② 向量数据库检索 → 找出最相关的文档片段（Top-K）
  ↓
③ 拼装 Prompt = 系统提示词 + 检索到的上下文 + 用户问题
  ↓
④ 大模型生成回答（流式输出）
  ↓
⑤ 返回答案 + 来源引用
```

## 2.2 RAG 核心技术拆解

### ① 文档向量化（Embedding）

文字如何变成数字？每段文字被映射为一个高维向量（如 1536 维），语义相似的文字向量"距离"更近。

```python
# 核心代码：backend/services/rag_service.py

from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 1. 文档分块（chunking）
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # 每块最多 500 个字符
    chunk_overlap=50,    # 相邻块重叠 50 字符（保留上下文）
    separators=["。", "\n\n", "\n"],  # 按句子/段落切割
)
chunks = splitter.split_documents(docs)

# 2. 向量化存入 FAISS
embedder = OpenAIEmbeddings(model="text-embedding-ada-002")
vectorstore = FAISS.from_documents(chunks, embedder)
```

**演示要点**：上传一份 PDF 后，展示左侧面板的分块预览，让学生看到文档被切成了多少个"片段"。

### ② 向量检索

```python
# 用户问题向量化，找最近邻
results = vectorstore.similarity_search_with_score(question, k=4)
# results 是按相似度排序的文档片段列表
```

**类比**：这就像图书馆索引，但不是靠关键词匹配，而是靠"语义距离"。

### ③ 提示词工程（Prompt Engineering）

这是让大模型"按规矩答题"的关键。

```
System Prompt 结构：

[角色定义]    → 你是一名专业的金融顾问助手...
[行为规范]    → 1.基于知识库回答 2.保持客观 3.投资建议注明风险
[知识库内容]  → 以下是检索到的相关文档：[RAG内容插入]
[输出格式]    → 请用中文，分点回答...
```

**课堂互动**：让学生在「设置」面板修改 System Prompt，对比以下效果差异：

```
版本A（简单）：你是金融助手，请回答问题。

版本B（专业）：你是一名资深金融分析师，拥有 CFA 认证...
               当知识库中有相关内容时，优先引用并标注来源...
               对于投资建议，必须加上"以上仅供参考，不构成投资建议"...
```

### ④ 流式输出（Streaming）

为什么答案是一个字一个字出来的？

```python
# 后端：使用 SSE（Server-Sent Events）流式返回
stream = await client.chat.completions.create(
    model="deepseek-chat",
    messages=[...],
    stream=True,          # 开启流式
)
async for chunk in stream:
    token = chunk.choices[0].delta.content
    yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

# 前端：监听数据流
const response = await fetch('/api/case1/chat', {...})
const reader = response.body.getReader()
while (true) {
    const { done, value } = await reader.read()
    if (done) break
    // 解析 SSE 数据，追加到消息末尾
}
```

**技术价值**：流式输出让用户感知延迟从「等待 10 秒」变为「立即看到内容」，提升用户体验。

## 2.3 课堂实践任务

> ⏱ 预计 15 分钟

**任务 1**：上传一份金融文档（可用任意 PDF），提问几个问题，观察「来源引用」。

**任务 2**：调整 Top-K 参数（1 vs 8），观察回答质量和来源数量的变化。

**任务 3**：修改 System Prompt，加入「请用表格总结要点」的要求，观察输出格式变化。

**思考题**：如果用户问的问题知识库里完全没有，系统会怎么处理？（观察系统行为）

---

# 案例二：金融数据分析实战

**技术关键词**：NL2SQL思路、ECharts可视化、Function Calling、SSE流式报告

## 3.1 核心技术链路

```
用户输入自然语言
    "分析贵州茅台近三年营收趋势"
           ↓
  LLM 意图解析（JSON输出）
  → 分析类型: trend
  → 目标公司: 贵州茅台
  → 指标: revenue
  → 时间范围: 3年
           ↓
  后端读取对应 CSV 数据
  + LLM 生成 ECharts 图表配置
           ↓
  前端渲染图表
           ↓
  LLM 流式生成分析报告
```

## 3.2 关键技术：让 LLM 输出结构化 JSON

这是 AI 应用开发的核心技巧之一。

**问题**：LLM 默认输出自然语言，我们需要它输出机器可处理的数据。

**方案**：`response_format={"type": "json_object"}`

```python
# backend/services/analysis_service.py

response = await client.chat.completions.create(
    model=get_model_name(),
    messages=[{
        "role": "user",
        "content": f"""
分析用户需求："{query}"
返回JSON，包含：
- analysis_type: trend/comparison/distribution
- companies: 涉及公司列表
- chart_config: 完整的 ECharts option 配置对象
- chart_title: 图表标题
只返回JSON，不要有其他文字。
"""
    }],
    response_format={"type": "json_object"},  # 强制 JSON 输出
)

chart_data = json.loads(response.choices[0].message.content)
```

**重要**：强制 JSON 输出使 AI 从"聊天工具"变成"可调用的分析引擎"。

## 3.3 ECharts 配置由 AI 生成

传统方式：开发者手写 ECharts 配置（需要学习 ECharts 文档）

AI 方式：AI 根据数据直接生成完整的 ECharts option 对象

```javascript
// AI 生成的 ECharts 配置示例
{
  "title": {"text": "贵州茅台 2022-2024 营收趋势"},
  "xAxis": {"type": "category", "data": ["2022Q1","2022Q2",...]},
  "yAxis": {"type": "value", "name": "亿元"},
  "series": [{
    "type": "line",
    "data": [280, 306, 357, 332, ...],
    "smooth": true,
    "areaStyle": {}
  }]
}
```

前端直接把这个 JSON 传给 ECharts 渲染，零手写图表配置。

## 3.4 分析数据概览

内置 10 支 A 股代表性标的，覆盖：

| 标的 | 代码 | 可展示的分析故事 |
|------|------|---------------|
| 贵州茅台 | 600519 | 毛利率 92%、净利率 50%，消费品护城河 |
| 宁德时代 | 300750 | 营收爆发后毛利率从 27% 压至 20%，竞争加剧 |
| 招商银行 | 600036 | 净息差从 2.49% 降至 1.99%，银行业承压 |
| 万科A | 000002 | 2023年净利润转负，地产危机数字化呈现 |
| 比亚迪 | 002594 | 营收 4年增长 5倍，净利润从 42亿到 402亿 |

**数据字段（25个指标/季度）**：营收、毛利润、毛利率、净利润、净利率、EPS、ROE、总资产、负债率、经营现金流、市盈率、市净率、换手率……

## 3.5 课堂实践任务

> ⏱ 预计 15 分钟

**任务 1**：输入以下查询，观察 AI 如何解析意图和生成图表：
- `对比招商银行和工商银行的净息差变化趋势`
- `分析宁德时代毛利率与净利率的剪刀差`
- `哪些股票的市盈率最低，股息率最高？`

**任务 2**：修改 `backend/services/analysis_service.py` 中的 prompt，要求 AI 额外输出「风险提示」章节，观察报告结构变化。

**思考题**：为什么图表配置由 AI 生成而不是预先写死？这种设计有什么优缺点？

---

# 案例三：投研全流程实践

**技术关键词**：并发 API 调用、雷达图、Markdown 流式渲染、模块化架构

## 4.1 投研平台的模块化设计

```
用户输入：公司名称
         ↓（并发）
┌─────────────────────────────────────────┐
│ ① 产业链图谱  ② 多源信息摘要  ③ 评分模型 │
│  (LLM生成)    (LLM生成)      (LLM生成)  │
└─────────────────────────────────────────┘
         ↓（汇总）
④ 一键生成投研报告（流式输出）
```

**技术要点**：三个模块并发请求，不串行等待，提升响应速度。

```javascript
// frontend/app/case3/page.tsx
// 并发请求三个接口
const [chainRes, infoRes, scoreRes] = await Promise.allSettled([
  fetch(api.case3.industryChain, { method: "POST", body }),
  fetch(api.case3.infoSummary,   { method: "POST", body }),
  fetch(api.case3.score,         { method: "POST", body }),
])
// 三个接口同时发出，等最慢的那个完成即可
```

## 4.2 产业链图谱：结构化数据生成

```python
# backend/services/research_service.py

prompt = f"""分析"{company}"的产业链，返回JSON：
{{
  "upstream": [
    {{"name": "上游类别", "examples": ["公司A","公司B"], "dependency": "高/中/低"}}
  ],
  "core": {{"name": "...", "products": [...], "core_competency": "..."}},
  "downstream": [
    {{"name": "下游类别", "examples": [...], "market_size": "...规模"}}
  ],
  "competitors": [{{"name": "...", "position": "..."}}],
  "industry_trend": "行业趋势（2-3句话）"
}}"""
```

**演示重点**：相同的提示词结构，换一个公司名，AI 就能生成完全不同的产业链。这展示了大模型的**零样本泛化能力**。

## 4.3 企业评分：AI 打分模型

```python
# 六个维度的评分模型
dimensions = [
    "盈利能力",    # ROE、净利率等
    "成长性",      # 营收/利润增速
    "财务健康",    # 负债率、流动比率
    "竞争优势",    # 市场份额、品牌壁垒
    "估值合理性",  # PE、PB 相对历史和行业
    "ESG评级",     # 环境、社会、公司治理
]
```

AI 返回每个维度 0-100 分 + 评分理由，前端用 ECharts **雷达图**可视化。

**关键设计原则**：
- 评分只是参考，报告中明确标注「仅供教学，不构成投资建议」
- 多维度量化让抽象判断可视化，便于对比

## 4.4 报告生成：大模型的"写作能力"

```python
# 给大模型一个结构化模板，让它"填空"
prompt = f"""基于以下数据生成投研报告：

产业链数据：{industry_chain}
信息摘要：{summary}
评分数据：{score}

报告格式：
# {company} 投研报告
## 投资评级 | 目标价
> 核心观点（2句话）
## 一、公司概况
## 二、产业链分析
## 三、近期动态
## 四、财务分析（表格）
## 五、综合评分
## 六、风险提示
## 七、投资建议（必须含免责声明）
"""
```

**技术亮点**：
1. 上下文窗口充分利用（传入前三步的分析结果）
2. 格式约束（Markdown 模板）确保输出一致性
3. 流式输出让用户实时看到报告"生长"

## 4.5 课堂实践任务

> ⏱ 预计 20 分钟

**任务 1**：分别对「贵州茅台」和「万科A」做完整投研，对比两份报告的差异。

**任务 2**：观察并发请求的效果——打开浏览器开发者工具 Network 面板，确认三个接口同时发出。

**任务 3**：修改 `research_service.py` 中的评分维度，加入「管理层稳定性」维度，看系统如何响应。

**思考题**：报告生成用了"产业链+信息摘要+评分"三份数据作为上下文，如果只给公司名，报告质量会有什么变化？

---

# 第二讲：核心技术原理

## 5.1 大模型 API 调用模式

所有案例的底层都是调用一个 HTTP API，理解这个是基础。

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key="your-key",
    base_url="https://api.deepseek.com/v1",  # DeepSeek 兼容 OpenAI 格式
)

response = await client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是..."},   # 系统提示词
        {"role": "user",   "content": "用户问题"},  # 用户输入
    ],
    temperature=0.3,    # 0=确定性强, 1=创意性强，金融场景建议 0.2-0.4
    max_tokens=2000,    # 最大输出长度
)

answer = response.choices[0].message.content
```

**参数调优建议**：

| 场景 | temperature | 说明 |
|------|-------------|------|
| 数据分析/事实查询 | 0.1-0.3 | 需要准确，不要"发挥" |
| 报告撰写 | 0.3-0.5 | 需要一定文采 |
| 创意内容 | 0.7-1.0 | 允许自由发挥 |

## 5.2 Embedding 模型 vs 生成模型

| 类型 | 用途 | 输入 | 输出 |
|------|------|------|------|
| 生成模型（GPT/DeepSeek） | 理解 + 生成文本 | 文字 | 文字 |
| Embedding 模型 | 文本向量化 | 文字 | 数字数组 |

两者在 RAG 中配合：
- Embedding 模型负责"索引"（文档变向量，存数据库）
- 生成模型负责"回答"（读取检索结果，生成回复）

## 5.3 Token 与成本控制

Token 是大模型计费的基本单位（大约每 1.5 个汉字 = 1 token）。

```python
# 实际项目中控制 token 用量的常见做法

# 1. 限制检索文档数量
top_k = 4   # 只取最相关的 4 段，而不是全部

# 2. 限制单个 chunk 长度
chunk_size = 500  # 每段不超过 500 字符

# 3. 设置 max_tokens
max_tokens = 1500  # 回复不超过 1500 token

# 4. 按需调用，避免重复请求
# 案例3 中三个分析模块结果缓存，报告生成时直接复用
```

**成本参考**（DeepSeek，截至 2025 年）：
- 输入：约 ¥1/百万 token
- 输出：约 ¥2/百万 token
- 一次完整投研报告生成：约 ¥0.05-0.10

## 5.4 前后端通信：SSE 流式协议

为什么不用普通 HTTP？

```
普通 HTTP：请求 → 等待 → 一次性返回所有内容（用户等待 10s+）
SSE 协议：请求 → 服务器持续推送 → 浏览器实时显示（无感知等待）
```

```
// SSE 数据格式（文本流）
data: {"type": "sources", "sources": [...]}

data: {"type": "token", "token": "贵"}
data: {"type": "token", "token": "州"}
data: {"type": "token", "token": "茅"}
data: {"type": "done"}
```

---

# 第三讲：系统架构与部署

## 6.1 整体架构图

```
学生浏览器
    │ HTTP/SSE
    ▼
┌───────────────────────────────────┐
│         Next.js 前端 :3000         │
│  门户页 → 案例1 → 案例2 → 案例3    │
└───────────────────────────────────┘
    │ REST API / SSE
    ▼
┌───────────────────────────────────┐
│         FastAPI 后端 :8000         │
│  /api/case1  /api/case2  /api/case3│
├───────────────────────────────────┤
│  rag_service │ analysis │ research │
└───────────────────────────────────┘
    │                    │
    ▼                    ▼
FAISS 向量库          CSV 数据文件
(案例1 知识库)        (案例2 股票数据)
    │
    ▼
大模型 API（DeepSeek / OpenAI）
```

## 6.2 项目目录结构解读

```
AI-Finance/
├── frontend/                  # React 前端（学生看到的界面）
│   ├── app/
│   │   ├── page.tsx           # 门户首页
│   │   ├── case1/page.tsx     # 案例1 对话界面
│   │   ├── case2/page.tsx     # 案例2 分析界面
│   │   └── case3/page.tsx     # 案例3 投研界面
│   └── lib/api.ts             # 前端 API 调用层
│
├── backend/                   # Python 后端（AI 逻辑）
│   ├── main.py                # FastAPI 主入口
│   ├── routers/               # 路由层（URL → 函数映射）
│   ├── services/              # 业务逻辑层（核心 AI 代码）
│   │   ├── rag_service.py     ← 核心：RAG 检索增强
│   │   ├── analysis_service.py ← 核心：数据分析
│   │   └── research_service.py ← 核心：投研生成
│   └── data/                  # 模拟金融数据（CSV）
│
├── docker-compose.yml         # 一键部署（云端）
└── .env                       # API Key 配置
```

## 6.3 云端部署（Docker）

```bash
# 在云服务器上（Ubuntu）
git clone <仓库地址>
cd AI-Finance
cp .env.example .env && vim .env   # 填 API Key

docker compose up -d               # 一键启动

# 验证
curl http://localhost:8000/health  # → {"status":"ok"}
curl http://localhost:3000         # → HTML 页面
```

学生通过「服务器 IP:3000」即可访问，无需本地安装任何东西。

---

# 第四讲：技术拓展与思考

## 7.1 如何让系统更智能——进阶方向

### 方向 1：多轮对话记忆（Memory）

当前系统每次对话独立，不记得上文。进阶实现：

```python
# 将历史消息保存，构建多轮对话
messages = [
    {"role": "system", "content": system_prompt},
    # 历史对话追加到这里
    {"role": "user",   "content": "上次你提到的那只股票..."},
    {"role": "assistant", "content": "..."},
    {"role": "user",   "content": "它今年的净利润是多少？"},
]
```

### 方向 2：Function Calling（工具调用）

让 AI 自主决定"要查什么数据"，不再依赖固定 prompt。

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_data",
            "description": "获取指定股票的财务数据",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "股票代码"},
                    "metric": {"type": "string", "description": "指标名称"},
                    "period": {"type": "string", "description": "时间范围"},
                }
            }
        }
    }
]
```

### 方向 3：Agent（自主任务拆解）

给 AI 一个高层目标，让它自行规划步骤并执行：

```
目标：「帮我分析半导体板块的投资机会」

Agent 自动执行：
  Step 1: 查询半导体行业相关股票列表
  Step 2: 逐一获取每家公司的财务数据
  Step 3: 对比分析，筛选出关键指标
  Step 4: 汇总生成分析报告
```

## 7.2 实际业务中的关键挑战

| 挑战 | 技术应对方案 |
|------|-------------|
| 模型幻觉（乱编数据） | RAG 强制引用来源 + 事实核查层 |
| 答案不稳定 | 降低 temperature + 结构化输出 |
| 敏感金融信息 | 本地部署私有化大模型（如 Qwen 本地版） |
| 处理速度慢 | 流式输出 + 异步并发 + 缓存热点查询 |
| 上下文长度限制 | 分层摘要 + 关键信息提取 |

## 7.3 工程师视角：大模型应用开发的核心心法

> 1. **大模型是组件，不是解决方案**
>    把它当成一个强大的"文字处理函数"，业务逻辑还得自己设计。
>
> 2. **Prompt 是代码**
>    提示词需要版本管理，需要测试，需要迭代优化。
>
> 3. **结构化输出是关键**
>    让 AI 输出 JSON，才能被系统消费；让 AI 输出自然语言，只能给人看。
>
> 4. **失败是常态，要设计降级**
>    API 超时、模型返回格式错误、内容不合规——每种情况都要有兜底处理。

---

# 附录：课堂 Q&A 参考答案

**Q：RAG 和 Fine-tuning（微调）有什么区别？**

A：RAG 是在推理时动态检索外部知识，适合需要实时更新的私有数据；Fine-tuning 是修改模型权重，让模型"学会"特定领域的语气和专业知识，两者可以结合使用。

**Q：为什么用 FAISS 不用传统关系型数据库？**

A：传统数据库擅长精确匹配（查 id=123 的记录），FAISS 擅长语义相似搜索（查"和这句话意思最接近的前5段文字"）。金融文档检索需要的是后者。

**Q：大模型生成的投研报告可以直接用吗？**

A：不可以直接用。AI 可能产生幻觉（编造数据），且不承担法律责任。当前阶段是"AI辅助人工"，人工需要核实关键数据后才能使用。

**Q：如何评估 RAG 系统的质量？**

A：常用指标：
- **召回率**：用户需要的信息是否被检索到？
- **准确率**：检索到的内容是否相关？
- **答案质量**：最终回答是否准确、完整？
可通过 RAGAS 等框架自动评估。

**Q：DeepSeek 和 OpenAI 哪个更适合金融场景？**

A：从技术角度：两者在中文理解上均表现出色，DeepSeek 价格更低（约 1/10），适合教学和初期验证；OpenAI GPT-4o 稳定性更高，适合生产环境。两者都通过同一套 OpenAI SDK 接入，切换只需改一个环境变量。

---

# 课程总结

## 三个案例覆盖的技术能力

```
案例1（问答助手）
  ✓ Embedding 向量化
  ✓ FAISS 相似检索
  ✓ Prompt Engineering
  ✓ SSE 流式输出

案例2（数据分析）
  ✓ JSON 结构化输出
  ✓ 动态图表生成（ECharts）
  ✓ 数据驱动报告

案例3（投研平台）
  ✓ 并发 API 调用
  ✓ 多步骤工作流
  ✓ 上下文窗口管理
  ✓ Markdown 报告导出
```

## 可带走的工程能力

1. **调用任意大模型 API**（OpenAI/DeepSeek/通义）
2. **搭建 RAG 系统**（文档上传→向量化→检索→问答）
3. **让 AI 输出结构化数据**（JSON/表格）用于下游处理
4. **实现流式输出**（SSE）提升用户体验
5. **设计模块化 AI 工作流**（多步骤并发）

---

*AI 金融案例教学平台 · 内部授课材料 · 请勿外传*
