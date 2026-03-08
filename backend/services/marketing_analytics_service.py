"""案例8：营销数据分析与决策智能体服务"""
from __future__ import annotations
import json
import random
from typing import AsyncGenerator, List, Dict, Tuple
from services.llm_client import get_llm_client, get_model_name

random.seed(77)

# 模拟营销数据
MOCK_MARKETING_DATA = {
    "channels": ["小红书", "抖音", "微博", "微信朋友圈", "百度搜索", "京东直投"],
    "weekly_performance": [
        {"channel": "小红书", "impressions": 125000, "clicks": 6250, "spend": 8500, "orders": 312, "revenue": 46800, "ctr": 5.0, "roi": 5.5},
        {"channel": "抖音", "impressions": 380000, "clicks": 11400, "spend": 22000, "orders": 456, "revenue": 68400, "ctr": 3.0, "roi": 3.1},
        {"channel": "微博", "impressions": 95000, "clicks": 2850, "spend": 6200, "orders": 114, "revenue": 17100, "ctr": 3.0, "roi": 2.8},
        {"channel": "微信朋友圈", "impressions": 68000, "clicks": 2720, "spend": 9800, "orders": 163, "revenue": 24450, "ctr": 4.0, "roi": 2.5},
        {"channel": "百度搜索", "impressions": 42000, "clicks": 3360, "spend": 5600, "orders": 202, "revenue": 30300, "ctr": 8.0, "roi": 5.4},
        {"channel": "京东直投", "impressions": 56000, "clicks": 1680, "spend": 4200, "orders": 92, "revenue": 13800, "ctr": 3.0, "roi": 3.3},
    ],
    "daily_revenue": [
        {"date": "03-01", "revenue": 28500, "orders": 190, "new_users": 85},
        {"date": "03-02", "revenue": 32100, "orders": 214, "new_users": 96},
        {"date": "03-03", "revenue": 41200, "orders": 275, "new_users": 123},
        {"date": "03-04", "revenue": 38700, "orders": 258, "new_users": 110},
        {"date": "03-05", "revenue": 15200, "orders": 101, "new_users": 45},
        {"date": "03-06", "revenue": 44600, "orders": 297, "new_users": 133},
        {"date": "03-07", "revenue": 51300, "orders": 342, "new_users": 158},
    ],
    "user_segments": [
        {"segment": "高价值用户", "count": 1280, "avg_ltv": 2850, "repurchase_rate": 78},
        {"segment": "成长用户", "count": 4560, "avg_ltv": 680, "repurchase_rate": 45},
        {"segment": "新用户", "count": 8920, "avg_ltv": 156, "repurchase_rate": 22},
        {"segment": "沉睡用户", "count": 3240, "avg_ltv": 89, "repurchase_rate": 8},
    ],
    "product_ranking": [
        {"name": "防晒衣", "revenue": 68500, "orders": 530, "category": "服饰"},
        {"name": "精华液", "revenue": 52300, "orders": 277, "category": "护肤"},
        {"name": "降噪耳机", "revenue": 47200, "orders": 118, "category": "数码"},
        {"name": "面膜套装", "revenue": 38900, "orders": 557, "category": "护肤"},
        {"name": "帆布包", "revenue": 22600, "orders": 180, "category": "配件"},
    ],
}

# 数据库"表结构"说明（用于NL2SQL生成）
DB_SCHEMA = """
数据库表结构：
- channel_performance（渠道表）: channel(渠道名), impressions(曝光量), clicks(点击量), spend(花费), orders(订单数), revenue(营收), ctr(点击率%), roi(投资回报率)
- daily_stats（每日统计）: date(日期), revenue(日营收), orders(日订单数), new_users(新增用户数)
- user_segments（用户分层）: segment(分层名称), count(用户数), avg_ltv(平均生命周期价值), repurchase_rate(复购率%)
- product_sales（商品销售）: name(商品名), revenue(销售额), orders(订单数), category(品类)

注意：以上是模拟数据，实际查询时直接从mock数据中提取结果。
"""

NL2SQL_PROMPT = """你是一名营销数据分析师，将业务问题转化为数据查询计划。

{db_schema}

当前数据概览：
{data_summary}

用户问题：{question}

请按步骤分析并返回JSON：
{{
  "intent": "问题核心意图（15字内）",
  "sql": "对应的SQL查询语句（基于上述表结构）",
  "data_needed": "需要查询的数据（表名和字段）",
  "chart_type": "推荐图表类型：bar/line/pie/table",
  "key_fields": ["关键字段1", "关键字段2"]
}}

只返回JSON。"""

COT_PROMPT = """你是一名资深营销决策顾问，请对以下数据进行深度分析。

用户问题：{question}

数据结果：
{data_result}

请按照思维链逐步分析（展示推理过程）：

**第一步：数据解读**
（描述数据基本特征，识别异常值）

**第二步：趋势与对比**
（与基准对比，判断是否异常，分析原因）

**第三步：归因分析**
（区分内外部因素，定位根本原因）

**第四步：策略建议**
（给出2-3条具体可执行建议，标注优先级）

**结论摘要**
（2句话总结核心洞察和首要行动项）"""


def _get_data_for_query(question: str) -> Tuple[dict, dict]:
    """根据问题提取相关数据和图表配置"""
    data = MOCK_MARKETING_DATA
    q_lower = question.lower()

    if any(k in q_lower for k in ["渠道", "roi", "投放", "花费", "平台"]):
        result_data = {"channels": data["channel_performance"]}
        chart = {
            "type": "bar",
            "title": "各渠道ROI对比",
            "xData": [c["channel"] for c in data["channel_performance"]],
            "yData": [c["roi"] for c in data["channel_performance"]],
            "yLabel": "ROI",
            "color": ["#6366f1" if c["roi"] >= 4 else "#f59e0b" if c["roi"] >= 3 else "#ef4444" for c in data["channel_performance"]],
        }
        return result_data, chart

    elif any(k in q_lower for k in ["日", "趋势", "走势", "每天", "营收", "订单"]):
        result_data = {"daily": data["daily_revenue"]}
        chart = {
            "type": "line",
            "title": "近7日营收与订单趋势",
            "xData": [d["date"] for d in data["daily_revenue"]],
            "series": [
                {"name": "营收(元)", "data": [d["revenue"] for d in data["daily_revenue"]]},
                {"name": "订单数", "data": [d["orders"] for d in data["daily_revenue"]]},
            ],
        }
        return result_data, chart

    elif any(k in q_lower for k in ["用户", "分层", "人群", "ltv", "复购"]):
        result_data = {"segments": data["user_segments"]}
        chart = {
            "type": "pie",
            "title": "用户分层分布",
            "data": [{"name": s["segment"], "value": s["count"]} for s in data["user_segments"]],
        }
        return result_data, chart

    elif any(k in q_lower for k in ["商品", "产品", "品类", "销售额", "热销"]):
        result_data = {"products": data["product_ranking"]}
        chart = {
            "type": "bar",
            "title": "商品销售额排行",
            "xData": [p["name"] for p in data["product_ranking"]],
            "yData": [p["revenue"] for p in data["product_ranking"]],
            "yLabel": "销售额(元)",
            "color": ["#10b981"] * len(data["product_ranking"]),
        }
        return result_data, chart

    else:
        # 默认返回渠道数据
        result_data = {"channels": data["channel_performance"]}
        chart = {
            "type": "bar",
            "title": "各渠道营销表现",
            "xData": [c["channel"] for c in data["channel_performance"]],
            "yData": [c["revenue"] for c in data["channel_performance"]],
            "yLabel": "营收(元)",
            "color": ["#6366f1"] * len(data["channel_performance"]),
        }
        return result_data, chart


async def query_stream(question: str) -> AsyncGenerator[dict, None]:
    """营销决策智能体：流式分析"""
    client = get_llm_client()
    model = get_model_name()

    yield {"type": "step", "step": "nl2sql", "message": "正在解析查询意图..."}

    # Step1: NL2SQL
    data_summary = f"""
渠道数量：{len(MOCK_MARKETING_DATA['channels'])}个
本周总营收：{sum(c['revenue'] for c in MOCK_MARKETING_DATA['weekly_performance'])}元
本周总订单：{sum(c['orders'] for c in MOCK_MARKETING_DATA['weekly_performance'])}单
ROI范围：{min(c['roi'] for c in MOCK_MARKETING_DATA['weekly_performance']):.1f} ~ {max(c['roi'] for c in MOCK_MARKETING_DATA['weekly_performance']):.1f}
"""
    try:
        nl2sql_resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": NL2SQL_PROMPT.format(
                db_schema=DB_SCHEMA,
                data_summary=data_summary,
                question=question,
            )}],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=400,
        )
        nl2sql_result = json.loads(nl2sql_resp.choices[0].message.content)
    except Exception:
        nl2sql_result = {
            "intent": "营销渠道效果分析",
            "sql": "SELECT channel, roi, revenue FROM channel_performance ORDER BY roi DESC",
            "chart_type": "bar",
        }

    yield {"type": "nl2sql", "result": nl2sql_result}

    # Step2: 数据提取
    yield {"type": "step", "step": "data", "message": "正在提取数据..."}
    result_data, chart_config = _get_data_for_query(question)
    yield {"type": "data", "data": result_data, "chart": chart_config}

    # Step3: COT分析（流式）
    yield {"type": "step", "step": "analysis", "message": "AI思维链分析中..."}

    stream = await client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": COT_PROMPT.format(
            question=question,
            data_result=json.dumps(result_data, ensure_ascii=False, indent=2),
        )}],
        temperature=0.3,
        max_tokens=1200,
        stream=True,
    )

    async for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        if token:
            yield {"type": "token", "token": token}

    yield {"type": "done"}


def get_dashboard_data() -> dict:
    """返回营销看板概览数据"""
    channels = MOCK_MARKETING_DATA["channel_performance"]
    daily = MOCK_MARKETING_DATA["daily_revenue"]

    total_revenue = sum(c["revenue"] for c in channels)
    total_spend = sum(c["spend"] for c in channels)
    total_orders = sum(c["orders"] for c in channels)
    avg_roi = total_revenue / total_spend if total_spend > 0 else 0

    # 找ROI最低渠道
    min_roi_channel = min(channels, key=lambda x: x["roi"])
    # 找ROI最高渠道
    max_roi_channel = max(channels, key=lambda x: x["roi"])

    # 03-05日营收异常（跌幅）
    anomaly_date = daily[4]
    prev_avg = sum(d["revenue"] for d in daily[:4]) / 4

    return {
        "summary": {
            "total_revenue": total_revenue,
            "total_spend": total_spend,
            "total_orders": total_orders,
            "avg_roi": round(avg_roi, 2),
            "best_channel": max_roi_channel["channel"],
            "worst_channel": min_roi_channel["channel"],
        },
        "channels": channels,
        "daily": daily,
        "segments": MOCK_MARKETING_DATA["user_segments"],
        "products": MOCK_MARKETING_DATA["product_ranking"],
        "anomaly": {
            "date": "03-05",
            "revenue": anomaly_date["revenue"],
            "prev_avg": round(prev_avg),
            "drop_pct": round((1 - anomaly_date["revenue"] / prev_avg) * 100),
        },
    }


EXAMPLE_QUERIES = [
    "上周哪个渠道ROI最低？",
    "近7天营收趋势如何，03-05为什么异常下跌？",
    "各用户分层的复购率对比",
    "哪个品类的商品销售额最高？",
    "给我一份本周营销渠道效果分析报告",
]


def get_example_queries() -> list[str]:
    return EXAMPLE_QUERIES
