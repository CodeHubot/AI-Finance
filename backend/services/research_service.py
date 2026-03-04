"""案例3：投研全流程服务"""
import json
from typing import AsyncGenerator

from services.llm_client import get_llm_client, get_model_name

# 模拟数据库：主要公司信息
COMPANY_DB = {
    "贵州茅台": {"industry": "白酒", "market_cap": "2.3万亿", "pe": 28.5, "pb": 8.2},
    "宁德时代": {"industry": "新能源电池", "market_cap": "1.1万亿", "pe": 35.2, "pb": 6.8},
    "中国平安": {"industry": "保险金融", "market_cap": "0.9万亿", "pe": 9.8, "pb": 1.3},
    "招商银行": {"industry": "商业银行", "market_cap": "1.0万亿", "pe": 7.2, "pb": 1.1},
    "比亚迪": {"industry": "新能源汽车", "market_cap": "0.8万亿", "pe": 22.1, "pb": 4.5},
}


async def generate_industry_chain(company: str) -> dict:
    """生成产业链图谱数据"""
    client = get_llm_client()

    prompt = f"""分析"{company}"的产业链结构，返回一个JSON对象，格式如下：
{{
  "company": "{company}",
  "upstream": [
    {{"name": "上游供应商类别1", "examples": ["公司A", "公司B"], "dependency": "高/中/低"}},
    ...（3-4个上游）
  ],
  "core": {{
    "name": "{company}",
    "products": ["核心产品1", "核心产品2"],
    "core_competency": "核心竞争力描述"
  }},
  "downstream": [
    {{"name": "下游客户类别1", "examples": ["客户A", "客户B"], "market_size": "市场规模"}},
    ...（3-4个下游）
  ],
  "competitors": [
    {{"name": "竞争对手", "position": "行业地位描述"}}
  ],
  "industry_trend": "行业发展趋势（2-3句话）"
}}
只返回JSON，数据要专业准确。"""

    response = await client.chat.completions.create(
        model=get_model_name(),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


async def generate_info_summary(company: str) -> dict:
    """生成多源信息摘要（公告/研报/舆情）"""
    client = get_llm_client()

    prompt = f"""为"{company}"生成一份模拟的多源信息聚合摘要，返回JSON：
{{
  "announcements": [
    {{"date": "2024-01-xx", "title": "公告标题", "summary": "摘要内容", "sentiment": "positive/neutral/negative"}},
    ...（3条最新公告）
  ],
  "research_reports": [
    {{"date": "2024-0x-xx", "institution": "券商名称", "rating": "买入/增持/中性/减持", "target_price": "目标价", "key_points": ["核心观点1", "核心观点2"]}},
    ...（3份研报）
  ],
  "news_sentiment": [
    {{"date": "2024-xx-xx", "source": "来源", "title": "新闻标题", "sentiment_score": 0.0-1.0之间的数, "sentiment_label": "正面/中性/负面"}},
    ...（5条新闻）
  ],
  "overall_sentiment": {{
    "score": 0.0-1.0之间的数,
    "label": "积极/中性/消极",
    "summary": "整体舆情概述（2句话）"
  }}
}}
数据要符合该公司实际情况，时间为最近3个月内。只返回JSON。"""

    response = await client.chat.completions.create(
        model=get_model_name(),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


async def generate_company_score(company: str) -> dict:
    """生成企业评分（雷达图数据）"""
    client = get_llm_client()

    prompt = f"""对"{company}"进行专业的投研评分，返回JSON：
{{
  "company": "{company}",
  "scores": {{
    "盈利能力": {{
      "score": 0-100之间整数,
      "rationale": "评分理由（1句话）",
      "key_metrics": ["ROE: xx%", "净利润率: xx%"]
    }},
    "成长性": {{
      "score": 0-100之间整数,
      "rationale": "评分理由",
      "key_metrics": ["营收增速: xx%", "利润增速: xx%"]
    }},
    "财务健康": {{
      "score": 0-100之间整数,
      "rationale": "评分理由",
      "key_metrics": ["资产负债率: xx%", "流动比率: x.x"]
    }},
    "竞争优势": {{
      "score": 0-100之间整数,
      "rationale": "评分理由",
      "key_metrics": ["市占率: xx%", "品牌价值: xx亿"]
    }},
    "估值合理性": {{
      "score": 0-100之间整数,
      "rationale": "评分理由",
      "key_metrics": ["PE: xx倍", "PB: x.x倍"]
    }},
    "ESG评级": {{
      "score": 0-100之间整数,
      "rationale": "评分理由",
      "key_metrics": ["ESG评级: A/B/C", "碳排放强度: 持平/下降"]
    }}
  }},
  "total_score": 0-100之间整数（加权平均）,
  "investment_rating": "强烈推荐/推荐/中性/谨慎/回避",
  "summary": "综合评价（3-4句话，要客观专业）"
}}
基于该公司实际情况评分，要有区分度。只返回JSON。"""

    response = await client.chat.completions.create(
        model=get_model_name(),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


async def generate_research_report(company: str, industry_chain: dict, summary: dict, score: dict) -> AsyncGenerator[str, None]:
    """一键生成标准投研报告（流式）"""
    client = get_llm_client()

    context = f"""
公司：{company}
产业链概况：{json.dumps(industry_chain, ensure_ascii=False)[:1000]}
信息摘要：{json.dumps(summary, ensure_ascii=False)[:1000]}
评分数据：{json.dumps(score, ensure_ascii=False)[:1000]}
"""

    prompt = f"""请基于以下数据，生成一份专业的A股投研报告（Markdown格式）：

{context}

报告格式如下（必须包含所有章节）：

# {company} 投研报告

## 投资评级：[评级] | 目标价：[价格]

> **核心观点**：[2句话核心结论]

---

## 一、公司概况
[公司基本面介绍，100字]

## 二、产业链分析
[上中下游分析，150字]

## 三、近期动态
### 3.1 重要公告
[列出2-3条关键公告]

### 3.2 研究机构观点
[汇总2-3家机构观点]

### 3.3 舆情分析
[舆情整体判断，50字]

## 四、财务分析
| 指标 | 数值 | 行业均值 | 评价 |
|------|------|----------|------|
[列出6个核心财务指标]

## 五、综合评分

| 维度 | 评分 | 说明 |
|------|------|------|
[列出6个评分维度]

**综合评分：[总分]/100**

## 六、风险提示
[列出3-4个具体风险因素]

## 七、投资建议
[明确的投资建议，100字，结尾必须注明"本报告仅供参考，不构成投资建议。"]

---
*报告生成时间：2025年 | AI辅助生成，仅供教学参考*"""

    stream = await client.chat.completions.create(
        model=get_model_name(),
        messages=[{"role": "user", "content": prompt}],
        stream=True,
        temperature=0.4,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
