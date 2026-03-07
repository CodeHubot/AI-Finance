"""案例2：金融数据分析服务"""
import json
from pathlib import Path
from typing import AsyncGenerator, Optional

import pandas as pd

from services.llm_client import get_llm_client, get_model_name

DATA_DIR = Path(__file__).parent.parent / "data"

# ── 默认提示词模板（{变量名} 为占位符，运行时自动替换）─────────────────────
DEFAULT_CHART_PROMPT = """\
你是一位专业的金融数据分析师。用户提出了以下分析需求：

"{query}"

可用股票列表（JSON）：
{stock_info}

历史数据样本（含价格与财务数据）：
{data_sample}

请分析用户需求，返回一个 JSON 对象，包含以下字段：
1. "analysis_type"：分析类型（trend / comparison / distribution / correlation 之一）
2. "companies"：涉及的公司名称列表
3. "metrics"：分析的核心指标（如 revenue / profit / price / pe_ratio / pb_ratio / roe 等）
4. "time_range"：时间范围描述
5. "chart_config"：完整的 ECharts option 配置对象（含 title / xAxis / yAxis / series 等）
6. "chart_title"：图表标题

对于 chart_config，请基于数据样本生成真实合理的金融数据来制作图表，数据需符合实际市场情况。
只返回 JSON，不要有其他文字。"""

DEFAULT_REPORT_PROMPT = """\
基于以下金融分析结果，生成一份专业的数据分析报告：

用户问题：{query}
分析类型：{analysis_type}
涉及公司：{companies}
分析指标：{metrics}
时间范围：{time_range}

请用 Markdown 格式输出报告，包含以下章节：

## 分析摘要
（2-3 句话概括核心发现）

## 数据解读
（详细分析图表数据，找出关键趋势和规律，引用具体数据支撑）

## 投资启示
（基于数据分析给出客观的投资参考建议，须注明风险）

## 风险提示
（列出 3-4 条相关风险因素）

语言要专业、客观，数据引用要具体。"""

# ──────────────────────────────────────────────────────────────────────────────


def get_available_stocks() -> list:
    """返回可用的股票列表"""
    return [
        {"symbol": "600519", "name": "贵州茅台", "sector": "白酒"},
        {"symbol": "300750", "name": "宁德时代", "sector": "新能源"},
        {"symbol": "601318", "name": "中国平安", "sector": "保险"},
        {"symbol": "600036", "name": "招商银行", "sector": "银行"},
        {"symbol": "601398", "name": "工商银行", "sector": "银行"},
        {"symbol": "002594", "name": "比亚迪", "sector": "汽车"},
        {"symbol": "600030", "name": "中信证券", "sector": "证券"},
        {"symbol": "300059", "name": "东方财富", "sector": "互联网金融"},
        {"symbol": "603288", "name": "海天味业", "sector": "食品"},
        {"symbol": "000002", "name": "万科A", "sector": "房地产"},
    ]


def load_stock_data(symbol: str, data_type: str = "price") -> pd.DataFrame:
    """加载股票数据"""
    file_path = DATA_DIR / f"stock_{symbol}_{data_type}.csv"
    if file_path.exists():
        return pd.read_csv(file_path)
    return pd.DataFrame()


def get_prompt_templates() -> dict:
    """返回案例2默认提示词模板及变量说明"""
    return {
        "chart_prompt": DEFAULT_CHART_PROMPT,
        "report_prompt": DEFAULT_REPORT_PROMPT,
        "variables": {
            "chart_prompt": [
                {"name": "query", "desc": "用户输入的自然语言分析需求"},
                {"name": "stock_info", "desc": "可用股票列表（JSON 数组）"},
                {"name": "data_sample", "desc": "实际财务/价格数据样本（前 3000 字符）"},
            ],
            "report_prompt": [
                {"name": "query", "desc": "用户原始问题"},
                {"name": "analysis_type", "desc": "AI 解析出的分析类型"},
                {"name": "companies", "desc": "涉及的公司列表"},
                {"name": "metrics", "desc": "分析的财务指标"},
                {"name": "time_range", "desc": "时间范围"},
            ],
        },
    }


async def analyze_with_nl(
    query: str, custom_prompts: Optional[dict] = None
) -> AsyncGenerator[dict, None]:
    """自然语言金融分析，返回图表配置和报告"""
    stocks = get_available_stocks()
    stock_info = json.dumps(stocks, ensure_ascii=False)

    # 加载相关数据
    all_data = {}
    for s in stocks:
        price_df = load_stock_data(s["symbol"], "price")
        financial_df = load_stock_data(s["symbol"], "financial")
        if not price_df.empty:
            all_data[s["name"]] = {
                "price": price_df.tail(30).to_dict(orient="records"),
                "financial": (
                    financial_df.tail(8).to_dict(orient="records")
                    if not financial_df.empty
                    else []
                ),
            }

    data_summary = json.dumps(all_data, ensure_ascii=False, default=str)

    templates = get_prompt_templates()
    chart_template = (custom_prompts or {}).get("chart_prompt") or templates["chart_prompt"]
    report_template = (custom_prompts or {}).get("report_prompt") or templates["report_prompt"]

    client = get_llm_client()

    # 第一步：解析查询意图并生成图表配置
    parse_prompt = (
        chart_template
        .replace("{query}", query)
        .replace("{stock_info}", stock_info)
        .replace("{data_sample}", data_summary[:3000])
    )

    chart_response = await client.chat.completions.create(
        model=get_model_name(),
        messages=[{"role": "user", "content": parse_prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    chart_data = json.loads(chart_response.choices[0].message.content)
    yield {"type": "chart", "data": chart_data}

    # 第二步：生成分析报告（流式）
    report_prompt = (
        report_template
        .replace("{query}", query)
        .replace("{analysis_type}", str(chart_data.get("analysis_type", "")))
        .replace("{companies}", str(chart_data.get("companies", [])))
        .replace("{metrics}", str(chart_data.get("metrics", [])))
        .replace("{time_range}", str(chart_data.get("time_range", "")))
    )

    stream = await client.chat.completions.create(
        model=get_model_name(),
        messages=[{"role": "user", "content": report_prompt}],
        stream=True,
        temperature=0.4,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield {"type": "report_token", "token": delta.content}

    yield {"type": "done"}
