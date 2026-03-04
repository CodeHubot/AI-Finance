"""案例2：金融数据分析服务"""
import json
import os
from pathlib import Path
from typing import AsyncGenerator

import pandas as pd

from services.llm_client import get_llm_client, get_model_name

DATA_DIR = Path(__file__).parent.parent / "data"


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


async def analyze_with_nl(query: str) -> AsyncGenerator[dict, None]:
    """自然语言金融分析，返回图表配置和报告"""
    stocks = get_available_stocks()
    stock_info = json.dumps(stocks, ensure_ascii=False)

    stocks_dict = {s["symbol"]: s["name"] for s in stocks}

    # 加载相关数据
    all_data = {}
    for s in stocks:
        price_df = load_stock_data(s["symbol"], "price")
        financial_df = load_stock_data(s["symbol"], "financial")
        if not price_df.empty:
            all_data[s["name"]] = {
                "price": price_df.tail(30).to_dict(orient="records"),
                "financial": financial_df.tail(8).to_dict(orient="records") if not financial_df.empty else [],
            }

    data_summary = json.dumps(all_data, ensure_ascii=False, default=str)

    client = get_llm_client()

    # 第一步：解析查询意图并生成图表
    parse_prompt = f"""你是一位专业的金融数据分析师。用户提出了以下分析需求：

"{query}"

可用股票列表：{stock_info}

部分数据样本：{data_summary[:3000]}

请分析用户需求，返回一个JSON对象，包含以下字段：
1. "analysis_type": 分析类型（trend/comparison/distribution/correlation 之一）
2. "companies": 涉及的公司列表
3. "metrics": 分析指标（revenue/profit/price/pe_ratio/pb_ratio 等）
4. "time_range": 时间范围描述
5. "chart_config": ECharts 图表配置对象（完整的 option 对象）
6. "chart_title": 图表标题

对于 chart_config，请生成真实、合理的金融数据来制作图表。数据要符合实际市场情况。
只返回 JSON，不要有其他文字。"""

    chart_response = await client.chat.completions.create(
        model=get_model_name(),
        messages=[{"role": "user", "content": parse_prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    chart_data = json.loads(chart_response.choices[0].message.content)
    yield {"type": "chart", "data": chart_data}

    # 第二步：生成分析报告（流式）
    report_prompt = f"""基于以下分析结果，请生成一份专业的金融数据分析报告：

用户问题：{query}
分析类型：{chart_data.get("analysis_type")}
涉及公司：{chart_data.get("companies")}
分析指标：{chart_data.get("metrics")}
时间范围：{chart_data.get("time_range")}

请用 Markdown 格式输出报告，包含以下部分：
## 分析摘要
（2-3句话概括核心发现）

## 数据解读
（详细分析图表数据，找出关键趋势和规律）

## 投资启示
（基于数据分析给出客观的投资参考建议，需注明风险）

## 风险提示
（相关风险因素）

语言要专业、客观，数据引用要具体。"""

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
