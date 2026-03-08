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

## 2.4 DeepSeek 扩展视角：从通用 RAG 到年报结构化提取

> 本节为概念延伸，无需上机操作，帮助学生理解 DeepSeek 在真实投研场景的使用层次。

**案例一演示的是通用 RAG**——把文档切块、向量化、检索、生成答案。这在"随便问"的场景下很有用。但真实投研需求往往更精确：

> 「帮我把所有上市公司年报里的 **营业收入、净利润、研发费用、管理层姓名** 都提取出来，存入数据库。」

这类任务需要的不是"随便找相关段落"，而是**结构化定向提取**。

### 通用 LLM（RAG）vs 专用提取模型（KPI-BERT）对比

| 维度 | 通用 RAG（我们的案例1） | KPI-BERT 式专用提取 |
|------|------|------|
| **适用场景** | 自由问答、探索性查询 | 固定字段的批量提取 |
| **输出形式** | 自然语言回答 | 结构化 JSON/表格 |
| **精度要求** | 允许一定模糊性 | 要求字段级精准 |
| **规模化** | 单次问答 | 可批量处理数百份年报 |
| **DeepSeek 方式** | 提示词 + RAG | 微调/few-shot + 结构化输出 |

**DeepSeek 在这一场景的典型做法**：

```python
# 结合 RAG + 结构化输出，从年报中提取关键财务变量
EXTRACTION_PROMPT = """
请从以下年报文本中提取关键信息，严格返回JSON格式：

年报片段：
{report_text}

需提取字段：
- company_name: 公司全称
- report_year: 报告年度
- revenue: 营业总收入（单位：亿元）
- net_profit: 净利润（单位：亿元）
- rd_expense: 研发费用（单位：亿元，如无则填null）
- ceo_name: 董事长/总经理姓名
- key_risks: 主要风险因素（数组，最多3条）

如某字段在文本中未提及，填null。只返回JSON，不要其他文字。
"""

response = await client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": EXTRACTION_PROMPT.format(
        report_text=retrieved_chunks
    )}],
    response_format={"type": "json_object"},  # 强制结构化输出
    temperature=0.0,   # 提取任务需要最高确定性
)
```

**DeepSeek 的核心优势**：能理解中文年报的专业表述（如"扣除非经常性损益后的归母净利润"），配合结构化输出指令，实现接近专用模型的提取精度。

**与 KPI-BERT 的关系**：KPI-BERT 是专门针对年报 KPI 提取微调的 BERT 类模型，精度更高但覆盖字段固定；DeepSeek 方式更灵活，可以根据需求实时调整提取字段，适合快速验证场景。

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

## 3.6 DeepSeek 扩展视角：情感分析驱动的投资组合构建

> 本节展示 DeepSeek 在金融数据分析中的一个重要真实应用。

**背景**：传统量化投资仅依靠历史价格/财务数据。DeepSeek 在投研中的一个直观落地场景，是**从金融分析报告中提取情感分数，并将其作为投资组合的量化因子**。

### 情感因子构建流程

```
金融研报/新闻文章 → DeepSeek 情感分析 → 情感分数（-1 到 +1）
                                              ↓
                           与量化选股因子（PE/ROE/动量等）融合
                                              ↓
                                    构建多因子投资组合
```

```python
# 从分析报告提取情感分数（结构化输出）
SENTIMENT_PROMPT = """
你是一名资深金融分析师，请对以下金融研报摘要进行情感分析。

研报内容：{report_text}

请分析并返回JSON：
{{
  "sentiment_score": 情感分数（-1.0到+1.0，+1为强烈看多，-1为强烈看空），
  "direction": "bullish/bearish/neutral",
  "confidence": 置信度（0.0到1.0），
  "key_positive_signals": ["积极信号1", "积极信号2"],
  "key_negative_signals": ["消极信号1"],
  "analyst_tone": "aggressive/conservative/neutral"
}}
"""

# 批量处理多份研报，构建情感时间序列
async def batch_sentiment_analysis(reports: list) -> pd.DataFrame:
    results = []
    for report in reports:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": SENTIMENT_PROMPT.format(
                report_text=report["content"][:2000]
            )}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        sentiment = json.loads(response.choices[0].message.content)
        results.append({
            "date": report["date"],
            "ticker": report["ticker"],
            "sentiment_score": sentiment["sentiment_score"],
            "confidence": sentiment["confidence"],
        })
    return pd.DataFrame(results)
```

### 情感因子的应用价值

| 应用场景 | 说明 |
|---------|------|
| **事件驱动交易** | 重大新闻发布后，情感分数剧烈变化往往领先价格 |
| **研报方向一致性** | 多家机构同向看多时，信号强度更高 |
| **情感反转信号** | 极度悲观时往往是底部，情感分数可辅助判断拐点 |
| **多空对冲** | 做多高情感分股票，做空低情感分股票 |

> **课堂思考**：情感因子是"超额信息"还是"已被市场消化的信息"？为什么情感分析在 A 股和美股的有效性可能不同？

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

> **与案例八的联动**：营销案例八展示了 Function Calling + Agent 工作流的完整实现，金融场景下原理完全相同，只是工具集从"营销数据库"换成"行情数据/研报数据库"。

### 方向 4：金融知识图谱构建（DeepSeek 特色应用）

从新闻和研报文本中自动生成**实体关系网络**，是 DeepSeek 在金融推理领域的重要应用方向：

```
新闻文本：「华为与宁德时代达成战略合作，共同开发车载储能系统，
           预计影响比亚迪的电池供应链格局...」

DeepSeek 提取结果：
  实体：华为、宁德时代、比亚迪
  关系：
    华为 --[合作]--> 宁德时代（强度：0.9）
    华为 --[竞争威胁]--> 比亚迪（强度：0.6）
    宁德时代 --[供应商]--> 比亚迪（强度：0.7）
```

```python
KG_EXTRACTION_PROMPT = """
从以下金融新闻中提取实体关系，构建知识图谱节点。

文本：{news_text}

返回JSON：
{{
  "entities": [
    {{"name": "实体名", "type": "company/person/product/event", "importance": 0-1}}
  ],
  "relations": [
    {{
      "source": "实体A",
      "target": "实体B",
      "relation_type": "合作/竞争/供应/投资/收购/监管",
      "strength": 0-1,
      "sentiment": "positive/negative/neutral"
    }}
  ],
  "business_impact": "对投资决策的潜在影响（1句话）"
}}
"""
```

**知识图谱在投研中的价值**：

| 用途 | 具体场景 |
|------|---------|
| 产业链穿透 | 追溯某公司在供应链中的上下游关联方 |
| 风险传导分析 | 一家公司爆雷，找出哪些关联公司受波及 |
| 竞争格局可视化 | 新进入者出现时，动态更新竞争网络 |
| 舆情关联分析 | 负面新闻涉及哪些实体，影响扩散路径是什么 |

### 方向 5：基于 Agent 的自动化交易模拟

DeepSeek 支持基于代理（Agent-Based Modeling）的自动化交易，可用于**模拟市场竞争**和**策略回测验证**：

```
AutoTrading Agent 架构：

信息输入层：价格数据 + 新闻情感 + 基本面指标
     ↓
决策 Agent：
  - 感知（Perceive）：处理市场状态
  - 推理（Reason）：CoT 分析买卖时机
  - 行动（Act）：生成交易指令
     ↓
风控层：仓位限制、止损规则、合规检查
     ↓
执行层：模拟订单提交（教学演示用虚拟账户）
```

> **注意**：自动化交易 Agent 在真实市场有严格监管限制，教学中只做模拟演示，培养"AI辅助决策"思维，而非全自动执行。

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

# 第五讲：DeepSeek 金融投研深度应用专题

> **本讲定位**：在前四讲工程实践基础上，系统梳理 DeepSeek 在真实金融投研机构中的前沿应用范式，帮助学生建立从"会用工具"到"理解应用格局"的完整视野。
>
> **内容来源**：结合业界实践与学术研究（KPI-BERT、知识图谱构建、基于代理的市场模拟等）系统整理。

---

## 8.1 DeepSeek 金融应用的两大核心场景框架

投研机构对 DeepSeek 的应用，可以归纳为两个根本出发点：

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  场景一：信息提取                                         │
│  ─────────────                                          │
│  将非结构化的文本信息（年报/研报/新闻）                    │
│  转化为结构化的、可量化的投研数据                          │
│                                                         │
│  场景二：提升日常工作效率                                  │
│  ─────────────────────────                              │
│  用 AI 替代投研人员的重复性工作                            │
│  （摘要整理、格式转换、对比分析、报告初稿）                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**两者的本质区别**：

| 维度 | 场景一：信息提取 | 场景二：效率提升 |
|------|------|------|
| **输出形式** | 结构化数据（JSON/表格/图谱） | 自然语言文档 |
| **下游用途** | 量化模型输入、数据库存储 | 人工审阅、决策参考 |
| **技术要求** | 高精度、低幻觉 | 高流畅性、格式规范 |
| **评估方式** | 字段提取准确率（可量化） | 人工评分（主观） |
| **代表案例** | 年报 KPI 提取、情感分析因子 | 研报摘要、会议纪要整理 |

> **讲课重点**：两个场景对 prompt 设计的要求完全不同。信息提取要"严格"，效率提升要"流畅"——不能用同一套提示词模板。

---

## 8.2 场景一深度解析：信息提取的四种形态

### 8.2.1 年报关键变量提取（结构化信息提取）

**应用背景**：A 股 5000+ 上市公司每年发布年报，投研团队无法逐一人工阅读，需要自动化提取关键指标。

**DeepSeek 典型处理流程**：

```
PDF 年报
   ↓ OCR/PDF解析
文本片段（按章节分割）
   ↓
DeepSeek 批量提取
   ↓
结构化 JSON → 数据库存储
   ↓
投研数据库（可被量化模型、分析师查询）
```

**演示：用课程案例一系统处理年报**

```python
# 在案例一的基础上，升级为结构化提取模式
# 将 chat 接口替换为批量提取接口

ANNUAL_REPORT_SCHEMA = """
从年报中提取以下字段（如字段不存在填null）：

基本信息：company_name, stock_code, report_year, report_date
财务数据：revenue, revenue_yoy, net_profit, net_profit_yoy,
          gross_margin, net_margin, roe, debt_ratio
研发数据：rd_expense, rd_ratio（研发费用/营收）, patent_count
人员数据：total_employees, rd_staff_count
风险因素：risk_factors（数组，最多5条）
未来展望：guidance_revenue, guidance_growth, key_strategies（数组）
管理层：chairman, ceo（如不同）, cfo
"""

# 关键：temperature=0，强制 JSON，批量并发处理
```

**精度对比**（典型业界数据）：

| 方法 | 数值字段准确率 | 文本字段准确率 | 处理速度 |
|------|------|------|------|
| 人工阅读 | 99%+ | 99%+ | 4h/份 |
| 传统 NLP（正则+规则） | 85% | 60% | 秒级 |
| KPI-BERT（专用微调模型） | 93% | 78% | 秒级 |
| DeepSeek（zero-shot） | 88% | 85% | 秒级 |
| DeepSeek（few-shot，5例） | 93% | 91% | 秒级 |

**结论**：DeepSeek 的优势在于**文本字段的语义理解**（如"核心风险""战略重点"这类非数值字段），而专用 KPI-BERT 在数值字段的格式识别上更稳定。两者互补使用是当前最优解。

---

### 8.2.2 新闻知识图谱构建（关系信息提取）

**应用背景**：金融市场中，公司之间的合作、竞争、供应链关系频繁变动，人工维护关系数据库成本极高。

**知识图谱构建的核心步骤**：

```
Step 1: 新闻文本输入
"华为与宁德时代签署战略合作，比亚迪将受到供应链冲击..."

Step 2: 实体识别（NER）
→ 公司：华为、宁德时代、比亚迪
→ 事件：战略合作签署、供应链冲击

Step 3: 关系抽取（RE）
→ 华为 -[战略合作]→ 宁德时代  (置信度: 0.95)
→ 事件 -[影响]→ 比亚迪        (置信度: 0.72)

Step 4: 图谱更新
→ 与现有知识图谱合并，更新节点关系权重

Step 5: 投研应用
→ 查询：宁德时代的一度关联公司有哪些？
→ 预警：与比亚迪有合作的公司中，哪些受到了负面影响？
```

**DeepSeek 在知识图谱中的角色**：

| 任务 | 传统方法 | DeepSeek 方式 | 优势 |
|------|------|------|------|
| 实体识别 | 规则词典 + BiLSTM | zero-shot NER | 可识别新出现的实体 |
| 关系分类 | 有标注数据微调 | few-shot 提示词 | 无需标注数据 |
| 关系强度 | 无 | 0-1 置信度打分 | 可量化 |
| 情感倾向 | 情感词典 | 上下文理解 | 准确理解金融语境 |

**典型投研应用**：生成"商业网络结构图"——以目标公司为中心，展示其一度/二度关联的合作伙伴、竞争者、供应商网络，为并购分析、风险穿透提供结构化依据。

---

### 8.2.3 情感分析驱动的投资组合（量化应用）

**这是 DeepSeek 在金融中最直观的量化落地**：将非结构化的分析报告转化为可以直接用于量化模型的情感分数。

**情感因子构建完整流程**：

```
数据源：
  ① 卖方研究报告（覆盖率最高）
  ② 财经新闻（时效性最强）
  ③ 社交媒体/论坛（情绪领先指标）
          ↓
DeepSeek 情感分析引擎
  - 情感极性：+1（强烈看多）~ -1（强烈看空）
  - 情感强度：0（模糊）~ 1（明确）
  - 话题分类：盈利/成长/估值/风险/行业
          ↓
情感因子时间序列（每个股票，每天更新）
          ↓
与量化因子融合：
  Alpha = w1×价值因子 + w2×动量因子 + w3×情感因子
          ↓
投资组合构建与回测
```

**实证结果参考**（业界研究）：

- 单独使用情感因子的年化收益（A股）：约 8-15%（超越基准）
- 与传统因子融合后，夏普比率提升约 0.2-0.4
- **最有效的情感信号来源**：卖方报告的评级上调/下调，而非正文情感
- **局限性**：情感因子在极端行情（暴涨暴跌）中表现不稳定

> **课堂思考**：
> 1. 情感因子是"预测未来"还是"确认已知"？
> 2. 所有人都用情感因子时，这个 Alpha 会不会消失？
> 3. 监管合规：用机器阅读研报构建交易信号，是否属于信息优势还是数据违规？

---

## 8.3 场景二深度解析：投研效率提升的六个典型场景

> 这些场景无需特殊技术，与我们课程案例一（RAG问答）、案例三（报告生成）高度一致，重点是让学生看到"工程实现"到"业务应用"之间的映射。

| 效率场景 | 对应技术 | 与课程案例的联系 |
|---------|---------|---------|
| **研报摘要自动生成** | 文档 → 结构化摘要 | 案例一：RAG+总结 |
| **多文档对比分析** | 并发检索+对比生成 | 案例三：多源信息聚合 |
| **季报变化追踪** | 前后对比+差异标注 | 案例一进阶 |
| **会议纪要整理** | 语音转写+要点提取 | 案例一变体 |
| **监管文件解读** | 专业术语解析+影响分析 | 案例一：金融专业场景 |
| **投研报告初稿** | 结构化输入+模板生成 | 案例三：完整实现 |

**重要认知：效率提升场景的技术门槛很低，竞争壁垒在于数据积累**

```
技术壁垒（低）：提示词工程 + API 调用，任何团队都能在几天内实现

数据壁垒（高）：
  - 私有历史研报库（10年+积累）
  - 内部评级体系与行业分类标准
  - 客户专属偏好数据
  - 合规审核通过的 prompt 模板库
```

> **对学生的职业启示**：做金融 AI 应用，技术只是入门券，真正的护城河是**对业务的深度理解**和**高质量私有数据**。

---

## 8.4 DeepSeek 时间序列技术分析

**这是 DeepSeek 在金融中与自然语言处理并列的第二大能力方向**，也是与前面讲述内容差别最大的部分。

### 背景：量价数据的特殊性

```
传统股票技术分析数据：
  日期 | 开盘价 | 最高价 | 最低价 | 收盘价 | 成交量
───────────────────────────────────────────────
2024-01 | 10.2 | 10.8 | 9.9 | 10.5 | 2.3M
2024-02 | 10.5 | 11.2 | 10.3 | 11.0 | 3.1M
...（连续数百个交易日）
```

传统技术分析依靠**人工判断**（识别头肩顶、双底、金叉死叉等形态），缺乏量化标准。DeepSeek 的目标是将这一过程**自动化和量化化**。

### 8.4.1 将时间序列转化为"文本"——大模型的巧妙切入

大模型本身处理的是离散 token，不能直接"读懂"连续数值序列。业界主要有两种路径：

**路径一：数值序列 → 文本描述 → LLM 分析**

```python
# 将量价数据转化为结构化文本描述
def serialize_ohlcv_to_text(df: pd.DataFrame, window: int = 20) -> str:
    """将OHLCV数据转化为LLM可理解的文本"""
    recent = df.tail(window)
    
    # 计算基础技术指标
    price_change = (recent['close'].iloc[-1] / recent['close'].iloc[0] - 1) * 100
    max_price = recent['high'].max()
    min_price = recent['low'].min()
    avg_volume = recent['volume'].mean()
    current_volume = recent['volume'].iloc[-1]
    
    # 识别趋势
    ma5 = recent['close'].rolling(5).mean().iloc[-1]
    ma20 = recent['close'].rolling(20).mean().iloc[-1]
    trend = "上升趋势" if ma5 > ma20 else "下降趋势"
    
    text = f"""
过去{window}个交易日技术分析数据：
- 区间涨跌幅：{price_change:.2f}%
- 价格区间：{min_price:.2f} ~ {max_price:.2f}
- 均线关系：MA5({ma5:.2f}) {'>' if ma5 > ma20 else '<'} MA20({ma20:.2f})，{trend}
- 当日成交量：{current_volume/1e6:.1f}M，较均量{'+' if current_volume>avg_volume else ''}{(current_volume/avg_volume-1)*100:.0f}%
- 近期K线形态：{_identify_pattern(recent)}
"""
    return text


TECHNICAL_ANALYSIS_PROMPT = """
你是一名资深技术分析师，请基于以下量价数据进行技术分析。

{price_data_description}

请分析：
1. 当前趋势判断（上升/震荡/下降，置信度0-1）
2. 关键支撑位和压力位
3. 是否存在技术形态信号（金叉/死叉/突破/背离等）
4. 成交量是否配合价格运动（量价关系）
5. 未来1-2周的走势预判（仅供参考，不构成投资建议）

返回JSON格式，包含 trend_direction, confidence, support_levels, resistance_levels, pattern_signals, volume_analysis, outlook
"""
```

**路径二：原生时间序列模型**（更学术，了解即可）

目前有研究将 LLM 直接扩展为时间序列基础模型（如 TimesFM、Lag-Llama），但在金融领域尚未成熟，预测准确率与传统方法（LSTM、Transformer）相比没有显著优势。

### 8.4.2 异常点识别——DeepSeek 的特色优势

在时间序列中识别"异常"（价格/成交量的异常波动），传统方法用统计学（Z-score、DBSCAN），而 DeepSeek 能做到**将数值异常与事件驱动关联**：

```
传统方法：
  2024-05-15 成交量 = 历史均值的 340% → 标记为"异常"

DeepSeek 方式：
  2024-05-15 成交量 = 历史均值的 340% → 检索当日新闻 →
  "当日下午发布重大并购公告" → 标记为"事件驱动型异常，预期有持续性"

  vs.

  2024-08-03 收盘价 = -8.5% → 无重大新闻 →
  "疑似市场情绪恐慌/程序化交易触发，可能存在过度反应"
```

这种**"数值异常 + 语义解释"**的联合分析，是 DeepSeek 相对于纯量化方法的核心差异点。

### 8.4.3 技术分析的局限性（重要）

> 对学生必须明确讲解，避免误导：

| 局限性 | 说明 |
|--------|------|
| **有效市场假说** | 若所有人都使用同样的技术分析，信号会被套利消除 |
| **过拟合风险** | 历史形态不必然重复，回测好不代表实盘好 |
| **短周期噪声** | 日内和短周期数据信噪比极低，AI 难以可靠预测 |
| **黑天鹅** | 宏观政策突变、地缘冲突等无法从量价数据中预测 |
| **合规边界** | 基于 AI 的自动化技术交易需符合各地监管要求 |

---

## 8.5 DeepSeek 金融推理：商业网络与市场竞争模拟

### 8.5.1 商业网络结构生成

**从文本 → 商业关系图 → 投研决策**，这是将知识图谱（8.2.2节）进一步用于**金融推理**的延伸。

```
输入：上市公司公告、供应商披露、投资关系说明书

DeepSeek 推理链：
  Step 1: 识别所有涉及的主体（公司/机构/人）
  Step 2: 提取主体间的商业关系（供应/客户/股权/合作）
  Step 3: 量化关系强度（营收占比/持股比例等）
  Step 4: 构建网络拓扑，计算中心性
  Step 5: 识别关键节点（"牵一发而动全身"的核心公司）

投研应用：
  "如果 A 公司被制裁，哪些公司受到的连锁影响最大？"
  "B 公司的核心客户集中度如何？是否存在大客户依赖风险？"
```

**网络中心性指标在投研中的含义**：

| 指标 | 金融含义 | 应用场景 |
|------|---------|---------|
| 度中心性（Degree） | 合作伙伴数量多 | 生态位强的平台型公司 |
| 介数中心性（Betweenness） | 产业链中的"枢纽" | 供应链关键节点公司 |
| 接近中心性（Closeness） | 信息流通快 | 行业情报领先者 |
| PageRank | 被重要公司连接 | 核心供应商/优质客户 |

### 8.5.2 基于 Agent 的市场模拟（ABM）

Agent-Based Modeling（ABM，基于代理的建模）是一种**模拟多个市场参与者行为**的计算方法。DeepSeek 在其中的角色是为每个"代理"提供**智能决策能力**：

```
传统 ABM（规则驱动）：
  每个 Agent 遵循预设规则：
  "若价格跌破5日均线则卖出"

DeepSeek-ABM（语言模型驱动）：
  每个 Agent 可以阅读新闻并推理：
  "今日美联储鹰派表态 + 股价接近阻力位 + 持仓已盈利15%
   → 综合判断：减仓50%，等待回调"
```

**教学演示思路**（无需复杂编程）：

```python
# 简化版：用 DeepSeek 模拟3类投资者的决策
AGENT_TYPES = {
    "趋势跟随者": "你是一名动量策略投资者，倾向于追涨杀跌",
    "价值投资者": "你是一名价值投资者，关注基本面，逢低买入",
    "套利交易者": "你是一名套利交易者，关注价差和统计异常",
}

market_scenario = """
当前市场情况：
- 某科技龙头股今日暴跌15%（因盈利预警）
- PE 已降至历史10%分位数
- 成交量是平均水平的5倍
- 科技板块整体回调3%
"""

# 让三类投资者各自给出决策并分析分歧
for agent_name, agent_persona in AGENT_TYPES.items():
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": agent_persona},
            {"role": "user", "content": f"面对以下市场情况，你的操作决策是什么？\n{market_scenario}"},
        ],
        temperature=0.5,
        max_tokens=300,
    )
    # 展示三类投资者的分歧 → 讨论市场是如何形成均衡的
```

**ABM 的教学价值**：帮助学生理解"市场价格"是大量异质性参与者博弈的结果，而不是单一"正确答案"——这比纯粹的预测模型更接近市场本质。

---

## 8.6 将 DeepSeek 能力融入现有案例的路线图

> 本讲所有内容，都是现有三个案例的**纵向深化**，帮助学生看到从"教学 Demo"到"业界真实应用"的完整路径。

```
案例一（RAG问答助手）
  └─ 进阶为年报结构化提取系统（8.2.1）
  └─ 加入知识图谱节点提取（8.2.2）
  └─ 支持多文档对比分析（8.3）

案例二（数据分析）
  └─ 增加情感因子计算与可视化（8.2.3）
  └─ 加入时间序列技术分析模块（8.4）
  └─ 异常点识别与新闻关联（8.4.2）

案例三（投研全流程）
  └─ 加入商业网络图谱生成（8.5.1）
  └─ 多智能体市场模拟演示（8.5.2）
  └─ 情感因子影响投研评分权重（8.2.3）
```

**给想继续深入的学生的建议路径**：

1. **信息提取方向**：学习 spaCy（NER）、Neo4j（图数据库）、LangGraph（工作流）
2. **量化金融方向**：学习 Backtrader/zipline（回测框架）、QuantLib（金融建模）
3. **多智能体方向**：学习 AutoGen、CrewAI、LangGraph
4. **时间序列方向**：了解 TimesFM、Chronos、Lag-Llama 等时序基础模型

---

## 8.7 Q&A 补充：关于 DeepSeek 在金融中的边界

**Q：DeepSeek 能预测股价吗？**

A：不能"可靠地"预测。DeepSeek 能做的是：（1）提取和整合更多信息；（2）提高分析效率；（3）发现人工容易忽视的模式。但市场具有自适应性——当一个预测方法被广泛使用时，其 Alpha 就会被套利消除。

**Q：情感因子真的有效吗？**

A：在大量学术研究中，情感因子在短期（1-4周）内对超额收益有统计显著性，但长期效果衰减，且在 A 股和美股表现有差异。关键是"你的情感数据获取是否比竞争对手更快、更准确"。

**Q：用 AI 做自动化交易违规吗？**

A：取决于具体形式。在中国大陆，程序化交易有专项监管规定（2024年起需备案），完全无人干预的"黑盒"交易系统面临合规风险。教学场景只做模拟演示，不涉及真实资金。

**Q：DeepSeek 比 GPT-4 在金融场景表现如何？**

A：在**中文金融文本**（中文年报、A股研报、中文新闻）的理解和提取上，DeepSeek 表现与 GPT-4o 相当，且成本约为 1/10。在**英文金融文本**（美股10-K、英文研报）和**复杂数学推理**场景，GPT-4o 仍有优势。对于本课程的教学场景，DeepSeek 是最佳性价比选择。

---

---

# 人工智能赋能互联网营销课程教学案例

> **授课定位**：技术应用导向，面向有编程基础的学生
> **核心主线**：学会用大模型 API + 工程化思路解决互联网营销场景的真实问题
> **覆盖方向**：内容创作 / 舆情监控 / 用户运营 / 互动营销 / 数据决策

---

## 五个案例技术全景

| 案例 | 核心大模型技术 | 营销应用场景 | 软件展示形态 |
|:---:|:---:|:---:|:---:|
| 案例1 | 提示工程、AIGC（文生图） | 内容创作 | 创意工坊工作台 |
| 案例2 | 文本情感分析、语义聚类 | 舆情监控 | 舆情大屏看板 |
| 案例3 | Embedding、向量检索 | 用户运营 | 推荐营销平台 |
| 案例4 | 多模态大模型、RAG、TTS | 互动营销 | 数字人直播间 |
| 案例5 | NL2SQL、思维链推理 | 数据分析 | 决策智能体助手 |

---

# 营销案例一：智能营销文案与创意生成系统开发

**技术关键词**：提示词工程、AIGC、文生图、结构化输出、A/B测试模拟

## M1.1 核心问题：为什么营销内容生产效率难以规模化？

**传统痛点演示**（课堂对比）：

- 一个文案策划，撰写一篇小红书种草笔记需要 2-3 小时
- 新品发布要同时覆盖小红书、知乎、抖音三平台，风格完全不同
- 大促活动期间需要几十套文案变体用于 A/B 测试

**解决方案：提示词模板工厂**

```
产品卖点输入
     ↓
① 平台风格识别（小红书/知乎/抖音）
     ↓
② 目标人群匹配（学生党/职场白领/宝妈）
     ↓
③ 提示词模板动态组装
     ↓
④ LLM 批量生成多版本文案
     ↓
⑤ 文生图 API 自动生成配套图片
     ↓
⑥ 点击率预估打分 → 人工筛选
```

## M1.2 核心技术拆解

### ① 多平台风格提示词模板设计

这是整个系统的"灵魂"——同样的产品，不同平台用完全不同的叙事逻辑。

```python
# 平台风格提示词模板库

PLATFORM_TEMPLATES = {
    "xiaohongshu": """
你是一名爆款小红书博主，擅长种草内容创作。
写作风格：亲切口语化、多用emoji、分享真实体验感
结构要求：
- 标题（含关键词，制造悬念/共鸣，15字以内）
- 开头钩子（1-2句，戳中痛点或制造好奇）
- 正文（产品体验/效果展示，500字左右）
- 结尾互动（引导评论/收藏）
- 标签（5-8个相关话题标签）

产品信息：{product_info}
目标人群：{target_audience}
核心卖点：{key_selling_points}
""",

    "zhihu": """
你是一名知乎专业答主，专注消费决策类内容。
写作风格：专业严谨、数据支撑、逻辑清晰
结构要求：
- 先说结论（直接回答是否推荐）
- 产品深度评测（参数/对比/实测数据）
- 适用场景分析（什么人适合/不适合购买）
- 购买建议（时机/渠道/注意事项）

产品信息：{product_info}
评测维度：{evaluation_dimensions}
""",

    "douyin": """
你是一名抖音带货主播，擅长快节奏口播文案。
写作风格：节奏感强、口语化、强调稀缺性和紧迫感
结构要求：
- 开场（3秒抓眼球，提问或惊叹）
- 产品亮点（快速介绍3个核心卖点，每点15字内）
- 促单话术（限时/限量/价格锚点）
- 行动引导（立即下单/点击链接/关注店铺）

产品信息：{product_info}
促销信息：{promotion_info}
"""
}
```

**演示要点**：用同一款产品（如防晒霜）分别套入三个模板，让学生直观感受风格差异。

### ② 批量生成与并发控制

```python
import asyncio
from openai import AsyncOpenAI

async def generate_copy_variants(
    product_info: dict,
    platforms: list,
    variants_per_platform: int = 3
) -> dict:
    """并发生成多平台多版本文案"""
    
    client = AsyncOpenAI(api_key=..., base_url=...)
    tasks = []
    
    for platform in platforms:
        for i in range(variants_per_platform):
            template = PLATFORM_TEMPLATES[platform]
            prompt = template.format(**product_info)
            
            # 每个变体用略有不同的 temperature 制造差异化
            temperature = 0.6 + i * 0.1   # 0.6 / 0.7 / 0.8
            
            tasks.append(
                client.chat.completions.create(
                    model="deepseek-chat",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                )
            )
    
    # 并发执行所有请求
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return parse_results(results, platforms, variants_per_platform)
```

**技术要点**：`asyncio.gather` 并发 9 个请求（3平台×3变体），总耗时 ≈ 单次请求耗时，而非串行的 9 倍。

### ③ 文生图 API 集成（配图自动匹配）

```python
# 根据文案自动生成配套图片
async def generate_product_image(copy_text: str, style: str) -> str:
    """文案 → 提炼视觉描述 → 调用文生图 API"""
    
    # Step1：让 LLM 从文案中提炼图片描述
    vision_prompt = await client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": f"""
基于以下营销文案，生成一段适合AI绘图的英文提示词：
- 风格：{style}（如 "商业摄影写真风" / "小清新插画风"）
- 要求：突出产品主体，画面简洁，适合社交媒体
- 输出：只输出英文提示词，50词以内

文案内容：{copy_text[:200]}
"""
        }]
    )
    
    image_prompt = vision_prompt.choices[0].message.content
    
    # Step2：调用文生图 API（以 DALL-E 3 / 稳定扩散 为例）
    image_response = await image_client.images.generate(
        model="dall-e-3",
        prompt=image_prompt,
        size="1024x1024",
        quality="standard",
    )
    
    return image_response.data[0].url
```

### ④ 点击率预估打分（A/B测试模拟）

```python
# 让 LLM 模拟"用户视角"给文案打分
SCORING_PROMPT = """
你是一名资深营销顾问，从目标用户视角评估以下文案的传播潜力。

目标人群：{audience}
平台：{platform}
文案内容：{copy}

请从以下维度打分（0-100），并给出1句改进建议：
- 标题吸引力（是否让人想点开）
- 内容相关性（是否与目标人群需求匹配）
- 行动引导力（是否让人产生购买/分享欲）
- 综合CTR预估分

返回JSON格式：
{{"title_score": 0, "relevance_score": 0, "action_score": 0, "ctr_estimate": 0, "suggestion": ""}}
"""
```

**演示要点**：生成9个版本后，按 `ctr_estimate` 降序排列，让学生看到 AI 自动"筛选"出最优版本。

## M1.3 系统界面展示要点

- **提示词模板库管理**：可视化编辑不同平台/人群的话术模板，支持变量占位符
- **文生图参数调节面板**：风格选择（写实/插画/扁平）、尺寸比例（1:1/9:16/16:9）
- **多版本对比展示**：网格布局展示9个版本，点击评分展开详情，一键导出选中素材

## M1.4 课堂实践任务

> ⏱ 预计 20 分钟

**任务 1**：输入一款产品（自选，如"便携充电宝"），生成三平台各3个版本文案，观察风格差异。

**任务 2**：修改小红书模板中的目标人群（从"大学生"改为"职场白领"），对比前后文案变化。

**任务 3**：调整 temperature 参数（0.3 vs 0.9），观察同平台同模板下的文案多样性变化。

**思考题**：如果一个品牌的 Tone of Voice（品牌口吻）有严格规范，应该如何把它编码进提示词模板中？

---

# 营销案例二：大模型驱动的社交媒体舆情洞察实战

**技术关键词**：文本情感分析、语义聚类、Embedding、可视化大屏、异常检测

## M2.1 核心问题：品牌如何从海量评论中快速获取洞察？

**痛点对比**（课堂演示）：

| 传统方式 | AI方式 |
|---------|--------|
| 人工逐条阅读评论，效率低 | 批量语义分析，秒级处理千条评论 |
| 只能做关键词统计，信息粗糙 | 情感强度+话题聚类，洞察精准 |
| 负面事件发现滞后（T+1天） | 实时预警，异常波动立即触发 |

**系统架构**：

```
模拟社交数据输入（小红书/微博/淘宝评论）
         ↓
① 数据清洗（去噪/去重/过滤广告）
         ↓
② 情感分析（正/负/中性 + 情绪强度 0-1）
         ↓
③ 话题聚类（Embedding + KMeans）
         ↓
④ 用户痛点提取（负面评论归因分析）
         ↓
⑤ 可视化大屏实时展示 + 预警推送
```

## M2.2 核心技术拆解

### ① 批量情感分析（结构化输出模式）

```python
async def analyze_sentiment_batch(comments: list[str]) -> list[dict]:
    """批量情感分析，使用 JSON 结构化输出"""
    
    # 将评论分批处理，每批20条（控制单次 token 用量）
    results = []
    batch_size = 20
    
    for i in range(0, len(comments), batch_size):
        batch = comments[i:i + batch_size]
        
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[{
                "role": "user",
                "content": f"""
对以下用户评论进行情感分析，返回JSON数组。

评论列表：
{json.dumps(batch, ensure_ascii=False)}

每条评论的分析结果包含：
- sentiment: "positive" / "negative" / "neutral"
- intensity: 情绪强度 0.0-1.0（1.0最强烈）
- emotion: 具体情绪标签（惊喜/失望/愤怒/满意/中立等）
- key_phrase: 触发该情绪的核心词组（5字以内）

只返回JSON数组，不要其他文字。
"""
            }],
            response_format={"type": "json_object"},
            temperature=0.1,   # 情感分析需要稳定性，用低 temperature
        )
        
        batch_results = json.loads(response.choices[0].message.content)
        results.extend(batch_results.get("results", []))
    
    return results
```

### ② 话题聚类（Embedding + KMeans）

```python
from sklearn.cluster import KMeans
import numpy as np

async def cluster_topics(comments: list[str], n_clusters: int = 8) -> dict:
    """
    将评论按语义聚类，发现主要话题
    不同于关键词统计，语义聚类能把"用料扎实""做工精细""品质好"归为同一话题
    """
    
    # Step1：批量 Embedding（获取语义向量）
    embedding_response = await client.embeddings.create(
        model="text-embedding-ada-002",
        input=comments,
    )
    vectors = np.array([e.embedding for e in embedding_response.data])
    
    # Step2：KMeans 聚类
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(vectors)
    
    # Step3：用 LLM 为每个聚类命名（提炼话题标签）
    clusters = {}
    for cluster_id in range(n_clusters):
        cluster_comments = [comments[i] for i, l in enumerate(labels) if l == cluster_id]
        sample = cluster_comments[:10]   # 取代表性样本
        
        naming_response = await client.chat.completions.create(
            messages=[{
                "role": "user",
                "content": f"以下是一组相似评论，用4-6个字概括它们的核心话题：\n{sample}"
            }]
        )
        topic_label = naming_response.choices[0].message.content.strip()
        clusters[topic_label] = {
            "count": len(cluster_comments),
            "samples": sample[:3],
        }
    
    return clusters
```

**演示要点**：展示聚类结果时，对比"关键词词云"和"语义话题聚类"两种结果，让学生看到语义理解的优势。

### ③ 负面舆情归因分析

```python
async def analyze_negative_root_cause(negative_comments: list[str]) -> dict:
    """对负面评论进行自动归因分析"""
    
    response = await client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": f"""
以下是品牌的负面用户评论（共{len(negative_comments)}条），请进行系统性归因分析。

评论样本（前50条）：
{json.dumps(negative_comments[:50], ensure_ascii=False)}

请分析并输出JSON：
{{
  "root_causes": [
    {{
      "category": "问题类别（产品质量/物流配送/客服体验/价格感知/描述不符等）",
      "proportion": "占负面评论的百分比",
      "severity": "严重程度 high/medium/low",
      "representative_complaint": "最典型的1条投诉",
      "suggested_action": "给品牌方的改善建议"
    }}
  ],
  "overall_summary": "整体负面舆情概述（2-3句话）",
  "urgency_level": "整体紧急程度 1-5"
}}
"""
        }],
        response_format={"type": "json_object"},
    )
    
    return json.loads(response.choices[0].message.content)
```

### ④ 舆情异常检测（趋势预警）

```python
def detect_anomaly(daily_negative_rate: list[float]) -> dict:
    """
    基于统计方法检测舆情异常波动
    当日负面率 > 历史均值 + 2个标准差 → 触发预警
    """
    mean = np.mean(daily_negative_rate[:-1])    # 历史均值（排除今天）
    std = np.std(daily_negative_rate[:-1])       # 历史标准差
    today = daily_negative_rate[-1]
    
    z_score = (today - mean) / (std + 1e-6)     # Z-score
    
    return {
        "is_anomaly": z_score > 2.0,
        "z_score": round(z_score, 2),
        "today_rate": today,
        "historical_avg": round(mean, 3),
        "alert_level": "高危" if z_score > 3 else "预警" if z_score > 2 else "正常"
    }
```

## M2.3 系统界面展示要点

- **舆情大屏实时看板**：正/负/中性比例环形图 + 情感趋势折线图 + 话题分布气泡图
- **情感分析结果词云**：正面词绿色、负面词红色，词的大小代表频次
- **负面舆情自动预警弹窗**：实时滚动显示异常评论，附带 AI 归因分析摘要

## M2.4 课堂实践任务

> ⏱ 预计 20 分钟

**任务 1**：加载模拟评论数据（可使用内置的1000条电商评论数据），运行情感分析，观察正负比例分布。

**任务 2**：调整聚类数量 `n_clusters`（5 vs 12），观察话题粒度变化，讨论如何选择合适的聚类数。

**任务 3**：手动向数据中注入10条极端负面评论，观察系统是否触发预警。

**思考题**：情感分析结果受什么影响最大——prompt设计、temperature、还是模型选择？如何设计实验验证？

---

# 营销案例三：大模型赋能智能推荐与用户分层全流程实践

**技术关键词**：Embedding向量、用户画像、KMeans聚类、推荐理由生成、A/B测试

## M3.1 核心问题：为什么千人千面比规则推荐更有效？

**传统规则推荐的局限**（课堂演示）：

```python
# 传统规则：简单粗暴
if user.age < 25 and user.gender == "female":
    recommend("美妆类目")
elif user.last_purchase_category == "数码":
    recommend("配件类目")
# 问题：规则越来越多，互相冲突，无法捕捉隐式意图
```

**AI方式：从行为到意图的语义理解**

```
用户行为数据（浏览/购买/评论）
           ↓
① 多维度画像构建（结构化 + 语义特征）
           ↓
② Embedding 向量化用户画像
           ↓
③ 向量空间用户分层（KMeans聚类）
           ↓
④ 每个用户群匹配最优商品策略
           ↓
⑤ 个性化推荐理由生成（LLM）
```

## M3.2 核心技术拆解

### ① 多维度用户画像构建

```python
def build_user_profile(user_data: dict) -> str:
    """
    将结构化用户数据转化为语义画像文本
    这是让 Embedding 模型能"理解"用户的关键
    """
    
    # 结构化特征
    demographic = f"年龄{user_data['age']}岁，{user_data['gender']}，{user_data['city']}"
    
    # 消费行为特征
    purchase_behavior = f"""
消费偏好：{'/'.join(user_data['top_categories'])}
价格敏感度：{user_data['avg_order_value']}元客单价，{'偏好折扣' if user_data['discount_rate'] > 0.6 else '品质导向'}
购买频率：{user_data['purchase_frequency']}次/月
"""
    
    # 内容行为特征
    content_behavior = f"""
浏览偏好：{'/'.join(user_data['browsed_categories'])}
停留时长：平均{user_data['avg_dwell_time']}秒/商品
收藏行为：偏好收藏{user_data['favorite_style']}风格商品
"""
    
    # 评论语义特征（最能反映隐式偏好）
    if user_data.get("review_texts"):
        review_summary = f"用户常提及：{', '.join(user_data['review_keywords'])}"
    else:
        review_summary = ""
    
    return f"{demographic}\n{purchase_behavior}\n{content_behavior}\n{review_summary}"


# 使用 Embedding 向量化用户画像
async def embed_user_profiles(profiles: list[str]) -> np.ndarray:
    response = await client.embeddings.create(
        model="text-embedding-ada-002",
        input=profiles,
    )
    return np.array([e.embedding for e in response.data])
```

### ② 用户分层（向量空间聚类）

```python
async def segment_users(users: list[dict], n_segments: int = 5) -> dict:
    """基于语义画像对用户进行分层"""
    
    # 构建文本画像
    profiles = [build_user_profile(u) for u in users]
    
    # 向量化
    vectors = await embed_user_profiles(profiles)
    
    # KMeans 聚类
    kmeans = KMeans(n_clusters=n_segments, random_state=42)
    labels = kmeans.fit_predict(vectors)
    
    # 用 LLM 为每个用户群命名和描述
    segments = {}
    for seg_id in range(n_segments):
        seg_users = [users[i] for i, l in enumerate(labels) if l == seg_id]
        seg_profiles = [profiles[i] for i, l in enumerate(labels) if l == seg_id]
        
        naming_response = await client.chat.completions.create(
            messages=[{
                "role": "user",
                "content": f"""
以下是一组相似用户的画像描述（共{len(seg_profiles)}人），请为这个用户群体：
1. 起一个营销标签名（4-6字，如"精致白领族"）
2. 描述核心特征（2-3句话）
3. 推荐最适合的营销策略（2条）

用户画像样本：
{json.dumps(seg_profiles[:5], ensure_ascii=False)}

返回JSON格式
"""
            }],
            response_format={"type": "json_object"},
        )
        
        segments[f"群体{seg_id+1}"] = {
            "user_count": len(seg_users),
            "label": naming_response.choices[0].message.content,
        }
    
    return segments
```

### ③ 个性化推荐理由生成

```python
async def generate_recommendation_reason(
    user_profile: str,
    product: dict,
    mode: str = "with_ai"    # "with_ai" or "without_ai"
) -> str:
    """
    生成个性化推荐理由
    对比展示：有AI vs 无AI的推荐话术差异
    """
    
    if mode == "without_ai":
        # 无AI：规则模板，千篇一律
        return f"热销推荐：{product['name']}，好评率{product['rating']}%"
    
    # 有AI：结合用户画像生成个性化话术
    response = await client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": f"""
根据用户画像，为该用户生成1句个性化推荐理由（25字以内，自然口语化，突出与该用户最相关的价值点）

用户画像：{user_profile}

推荐商品：
- 名称：{product['name']}
- 核心卖点：{product['selling_points']}
- 用户评价关键词：{product['review_keywords']}

只输出推荐理由这一句话，不要其他内容。
"""
        }],
        temperature=0.4,
    )
    
    return response.choices[0].message.content.strip()
```

## M3.3 系统界面展示要点

- **用户画像标签化展示**：气泡图形式展示消费标签（大小=权重）+ 语义标签词云
- **推荐策略配置面板**：左侧人工规则配置区 + 右侧AI权重滑块，两者融合决定最终排序
- **个性化推荐理由对比**：同一商品对不同用户群生成不同推荐语，"无AI模板"vs"有AI个性化"双列对比

## M3.4 课堂实践任务

> ⏱ 预计 20 分钟

**任务 1**：使用内置1000个模拟用户数据，运行分层算法，查看5个用户群的特征标签，讨论营销策略差异。

**任务 2**：对同一件商品（如"无线耳机"），为"价格敏感学生族"和"品质导向白领族"分别生成推荐理由，对比差异。

**任务 3**：调整分层数量（3层 vs 8层），讨论粒度对营销策略制定的影响。

**思考题**：如果某用户既是"价格敏感型"又刚刚购买了奢侈品，传统规则引擎和AI向量画像会分别如何处理这种矛盾信号？

---

# 营销案例四：数字人直播与智能导购助手开发

**技术关键词**：RAG知识库、多模态LLM、TTS语音合成、实时对话、知识检索

## M4.1 核心问题：7x24小时直播的人力成本如何突破？

**传统直播带货的瓶颈**：

```
主播工作时间 ≤ 8小时/天
话术质量依赖个人经验，难以标准化
用户提问时主播可能正在讲产品，无法实时回复弹幕
培训新主播成本高、周期长
```

**数字人 + RAG 的解决方案**：

```
用户发送弹幕/提问
        ↓
① 语音/文字识别（ASR）
        ↓
② 意图理解（闲聊/产品咨询/促单询问）
        ↓
③ RAG 知识库检索（产品信息/促销规则/FAQ）
        ↓
④ LLM 生成回复（带情绪感知，促单场景加强语气）
        ↓
⑤ TTS 语音合成（声音克隆，保持数字人人设）
        ↓
⑥ 数字人口型驱动 → 实时播放
```

## M4.2 核心技术拆解

### ① 产品知识库构建（RAG）

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

class ProductKnowledgeBase:
    """直播带货专用知识库"""
    
    def __init__(self):
        self.embedder = OpenAIEmbeddings(model="text-embedding-ada-002")
        self.vectorstore = None
    
    def build_from_products(self, products: list[dict]) -> None:
        """将商品信息结构化为检索文档"""
        
        documents = []
        for product in products:
            # 将每个商品的不同信息类型分别存储
            docs = [
                # 基础信息文档
                f"""商品名称：{product['name']}
规格参数：{product['specs']}
核心卖点：{' / '.join(product['selling_points'])}
适用人群：{product['target_user']}
价格：原价{product['original_price']}元，活动价{product['sale_price']}元""",
                
                # FAQ文档
                f"""商品：{product['name']} 常见问题
{''.join([f"Q:{qa['q']} A:{qa['a']} " for qa in product['faq']])}""",
                
                # 促销规则文档
                f"""商品：{product['name']} 活动规则
{product['promotion_rules']}
库存提示：{product['stock_alert']}""",
            ]
            documents.extend(docs)
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=300,
            chunk_overlap=30,
        )
        chunks = splitter.create_documents(documents)
        self.vectorstore = FAISS.from_documents(chunks, self.embedder)
    
    def search(self, query: str, k: int = 3) -> list[str]:
        """检索最相关的产品知识"""
        results = self.vectorstore.similarity_search(query, k=k)
        return [doc.page_content for doc in results]
```

### ② 直播话术智能生成

```python
LIVEROOM_SYSTEM_PROMPT = """
你是{anchor_name}，{brand_name}的官方直播间主播。
性格特点：{personality}
说话风格：亲切热情，专业但不生硬，擅长促单但不强迫

直播场景规则：
1. 如果用户询问产品信息，优先基于知识库回答，确保准确
2. 如果是闲聊或感谢，简短回应保持气氛，不超过15字
3. 如果用户询问价格或犹豫购买，适当使用稀缺话术（"现在下单有优惠"）
4. 如果知识库中没有信息，诚实说"这个问题我帮你问一下"，不要编造

当前正在介绍的产品：{current_product}
当前活动信息：{current_promotion}

知识库检索结果：
{retrieved_knowledge}
"""

async def generate_live_response(
    user_message: str,
    knowledge_base: ProductKnowledgeBase,
    context: dict,
) -> str:
    """生成直播回复话术"""
    
    # RAG 检索
    relevant_knowledge = knowledge_base.search(user_message, k=3)
    
    system_prompt = LIVEROOM_SYSTEM_PROMPT.format(
        **context,
        retrieved_knowledge="\n---\n".join(relevant_knowledge)
    )
    
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.5,
        max_tokens=150,    # 直播回复要简短，控制字数
    )
    
    return response.choices[0].message.content
```

### ③ TTS语音合成（声音克隆）

```python
import requests

async def text_to_speech(
    text: str,
    voice_id: str,    # 声音克隆后的 voice_id
    speed: float = 1.1,   # 直播语速略快
) -> bytes:
    """
    将文字转换为主播声音
    生产环境可接入：阿里云 TTS / 微软 Azure TTS / ElevenLabs
    教学环境可用 OpenAI TTS 模拟
    """
    
    response = await client.audio.speech.create(
        model="tts-1",
        voice="shimmer",    # 教学演示用内置声音
        input=text,
        speed=speed,
    )
    
    return response.content   # 返回 MP3 bytes，前端直接播放
```

## M4.3 系统界面展示要点

- **数字人配置面板**：主播形象选择（卡通/写实）+ 声音风格选择 + 语速/语调调节
- **产品知识库管理**：拖拽上传商品Excel/PDF → 自动分段 → 检索测试（输入问题看命中哪段）
- **实时对话演示窗口**：左侧弹幕输入区 + 右侧数字人回复展示（文字+音频播放器）

## M4.4 课堂实践任务

> ⏱ 预计 25 分钟

**任务 1**：上传3款模拟商品信息（可用内置数据），向知识库提问，测试检索准确率。

**任务 2**：分别测试以下三类用户提问，观察回复策略差异：
- `"这个多少钱？"` （询价场景）
- `"防水吗？"` （参数咨询场景）
- `"等会儿再看"` （流失挽回场景）

**任务 3**：修改 System Prompt 中的 `personality`（如从"亲切活泼"改为"专业严肃"），对比话术风格变化。

**思考题**：数字人直播中，RAG 知识库的质量（信息完整度、更新及时性）对用户体验的影响有多大？如何持续维护知识库质量？

---

# 营销案例五：大模型驱动的营销数据分析与决策智能体实战

**技术关键词**：NL2SQL、思维链推理、多步骤Agent、Function Calling、动态图表

## M5.1 核心问题：营销人员如何不懂SQL也能分析数据？

**传统数据分析链路**：

```
业务问题（营销人员）
      ↓ 口头描述需求（信息损耗）
数据分析师
      ↓ 编写SQL/Python（1-3天）
报表结果
      ↓ 口头解读（再次信息损耗）
营销决策
```

**AI决策智能体链路**：

```
业务问题（营销人员用自然语言输入）
      ↓
① 意图理解：明确分析目标和时间范围
      ↓
② NL2SQL：将自然语言转化为精确的SQL查询
      ↓
③ 执行查询：调用数据库工具获取真实数据
      ↓
④ 思维链分析：逐步推理，发现异常和规律
      ↓
⑤ 策略生成：基于数据洞察给出可执行建议
      ↓
可视化报告（即时生成，支持追问）
```

## M5.2 核心技术拆解

### ① NL2SQL：自然语言转数据库查询

```python
NL2SQL_PROMPT = """
你是一名专业的营销数据分析师，负责将业务问题转化为精确的SQL查询。

数据库表结构：
- orders（订单表）: order_id, user_id, product_id, channel, amount, created_at, status
- users（用户表）: user_id, age, gender, city, register_date, user_segment
- products（商品表）: product_id, name, category, cost, price
- campaigns（营销活动表）: campaign_id, name, channel, budget, start_date, end_date
- ad_performance（广告投放表）: date, channel, campaign_id, impressions, clicks, spend, conversions

当前日期：{current_date}

业务问题：{user_question}

请按以下步骤分析：
1. 理解问题涉及的核心指标（ROI/转化率/LTV等）
2. 确定需要关联的数据表
3. 写出精确的 SQL 查询语句
4. 解释查询逻辑

返回JSON：
{{
  "analysis_intent": "问题核心意图",
  "sql": "完整的SQL语句",
  "key_metrics": ["涉及的关键指标"],
  "explanation": "SQL逻辑说明"
}}
"""

async def natural_language_to_sql(question: str) -> dict:
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[{
            "role": "user",
            "content": NL2SQL_PROMPT.format(
                current_date=datetime.now().strftime("%Y-%m-%d"),
                user_question=question
            )
        }],
        response_format={"type": "json_object"},
        temperature=0.1,    # SQL生成需要确定性
    )
    return json.loads(response.choices[0].message.content)
```

### ② 思维链推理（Chain of Thought）

```python
COT_ANALYSIS_PROMPT = """
你是营销决策顾问，请对以下数据进行深度分析。

用户问题：{question}
查询结果数据：{data}

请按照以下思维链逐步分析（请展示推理过程，不要跳步）：

【第一步：数据解读】
- 描述数据的基本特征和分布
- 识别异常值或突出数据点

【第二步：趋势判断】
- 与历史对比，判断是否存在异常波动
- 分析可能的影响因素

【第三步：归因分析】
- 对异常或值得关注的数据点进行归因
- 区分外部因素（市场/季节）和内部因素（策略/运营）

【第四步：策略建议】
- 基于以上分析，给出2-3条具体可执行的营销优化建议
- 每条建议注明预期效果和实施优先级

【结论摘要】
- 用2句话总结最关键的洞察和首要行动项
"""

async def chain_of_thought_analysis(
    question: str,
    data: dict,
) -> AsyncGenerator[str, None]:
    """使用思维链推理分析营销数据（流式输出）"""
    
    stream = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[{
            "role": "user",
            "content": COT_ANALYSIS_PROMPT.format(
                question=question,
                data=json.dumps(data, ensure_ascii=False, indent=2)
            )
        }],
        temperature=0.3,
        stream=True,
    )
    
    async for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token
```

### ③ Function Calling：让 Agent 自主调用工具

```python
# 定义 Agent 可以使用的工具集
MARKETING_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "query_marketing_data",
            "description": "执行SQL查询获取营销数据",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "SQL查询语句"},
                    "description": {"type": "string", "description": "查询目的说明"},
                },
                "required": ["sql"],
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_chart",
            "description": "生成数据可视化图表（ECharts配置）",
            "parameters": {
                "type": "object",
                "properties": {
                    "chart_type": {"type": "string", "enum": ["line", "bar", "pie", "scatter"]},
                    "data": {"type": "object", "description": "图表数据"},
                    "title": {"type": "string", "description": "图表标题"},
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_marketing_metrics",
            "description": "计算营销关键指标（ROI/LTV/CAC/转化率等）",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {"type": "string", "description": "指标名称"},
                    "date_range": {"type": "string", "description": "计算时间范围"},
                    "channel": {"type": "string", "description": "渠道筛选（可选）"},
                }
            }
        }
    }
]

async def marketing_agent(user_question: str) -> AsyncGenerator:
    """营销决策智能体：自主规划并执行多步骤分析"""
    
    messages = [
        {"role": "system", "content": "你是营销决策智能体，通过调用工具完成数据分析任务。先规划分析步骤，再逐步执行，最后给出决策建议。"},
        {"role": "user", "content": user_question}
    ]
    
    # Agent 循环：LLM 决策 → 执行工具 → 继续分析
    max_steps = 5
    for step in range(max_steps):
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            tools=MARKETING_TOOLS,
            tool_choice="auto",
        )
        
        message = response.choices[0].message
        
        # 如果 LLM 决定调用工具
        if message.tool_calls:
            for tool_call in message.tool_calls:
                result = await execute_tool(tool_call)
                messages.append({"role": "tool", "content": str(result), "tool_call_id": tool_call.id})
        else:
            # LLM 直接回答，分析完成
            yield message.content
            break
```

## M5.3 典型查询展示

课堂演示的问题集（逐步增加复杂度）：

| 难度 | 示例问题 | 技术挑战 |
|:---:|---------|---------|
| ⭐ | `"上周各渠道的总销售额是多少？"` | 基础聚合查询 |
| ⭐⭐ | `"哪个渠道的ROI最低？原因可能是什么？"` | 计算指标 + 归因推理 |
| ⭐⭐⭐ | `"用户在购买前平均浏览了多少次？哪个品类的犹豫期最长？"` | 多表关联 + 行为分析 |
| ⭐⭐⭐⭐ | `"给我一份本月营销复盘报告，包含ROI、各渠道贡献度和下月预算建议"` | 多步骤Agent + 完整报告 |

## M5.4 系统界面展示要点

- **自然语言查询输入框**：支持中文提问，实时显示 AI 生成的 SQL 语句（可编辑确认）
- **数据查询结果可视化**：根据数据类型自动选择最合适的图表类型（趋势→折线，对比→柱状，占比→饼图）
- **AI分析结论与策略建议区**：思维链推理过程流式展示，最终建议高亮标注，支持"追问"继续深入

## M5.5 课堂实践任务

> ⏱ 预计 25 分钟

**任务 1**：用自然语言提问基础问题（"上周哪个渠道销售额最高？"），观察 NL2SQL 转换结果和数据可视化。

**任务 2**：提问需要多步推理的问题（"ROI最低的渠道，问题出在哪个环节？"），观察思维链推理过程。

**任务 3**：让 Agent 生成一份完整的周度营销复盘报告，观察多工具调用的执行链路。

**思考题**：思维链推理（Chain of Thought）和直接输出答案相比，在营销决策场景中有什么优势？什么情况下反而不需要 CoT？

---

# 营销课程总结

## 五个案例覆盖的技术能力

```
案例1（创意生成）
  ✓ 多平台提示词模板设计
  ✓ 并发 API 调用（asyncio.gather）
  ✓ 文生图 API 集成
  ✓ 结构化输出（JSON评分）

案例2（舆情洞察）
  ✓ 批量文本情感分析
  ✓ Embedding + KMeans 语义聚类
  ✓ 统计异常检测（Z-score预警）
  ✓ 数据可视化大屏

案例3（智能推荐）
  ✓ 用户画像文本化
  ✓ 向量化用户分层
  ✓ 个性化内容生成
  ✓ 规则引擎 + AI 融合

案例4（数字人导购）
  ✓ 垂直场景 RAG 知识库
  ✓ 实时对话系统
  ✓ TTS 语音合成集成
  ✓ 多轮上下文管理

案例5（决策智能体）
  ✓ NL2SQL 自然语言查询
  ✓ Chain of Thought 推理
  ✓ Function Calling 工具调用
  ✓ 多步骤 Agent 工作流
```

## 可带走的营销 AI 工程能力

1. **设计提示词模板库**，实现内容生产标准化与规模化
2. **搭建文本分析流水线**（批量情感分析 + 语义聚类）
3. **构建垂直场景 RAG 知识库**（产品知识 / 品牌规范）
4. **实现 NL2SQL 业务查询接口**，让非技术人员可自助分析数据
5. **设计多工具 Agent 工作流**，完成复杂多步骤营销分析任务

---

*AI 营销案例教学平台 · 内部授课材料 · 请勿外传*
