"""案例5：社交媒体舆情洞察服务"""
from __future__ import annotations
import json
import random
from typing import AsyncGenerator, List
from services.llm_client import get_llm_client, get_model_name

# 模拟评论数据（200条，覆盖多种情感）
MOCK_COMMENTS = [
    # 正面评论 - 产品质量
    "这款产品真的太好用了，用了一周皮肤明显变好！强烈推荐给大家✨",
    "质量超出预期，包装精美，物流也很快，非常满意！",
    "一直在回购的产品，效果稳定，性价比超高",
    "朋友推荐的，果然没让我失望，已经回购3次了",
    "做工精细，质感很好，值得购买",
    "用了两个月效果很明显，皮肤水润了很多",
    "气味很好闻，质地轻薄，夏天用特别舒服",
    "颜值很高，摆在桌子上也很好看，实用性也强",
    "真的很好用，我妈用了也说好，全家都在用",
    "物流超快，第二天就到了，包装完好无损",
    # 正面评论 - 客服体验
    "客服态度非常好，有问必答，处理问题很及时",
    "售后服务做得很好，遇到问题马上处理，五星好评",
    "这家店的服务真的没话说，退换货也很方便",
    "客服小姐姐超级耐心，问了好多问题都回答了",
    # 正面评论 - 价格
    "这个价格真的良心，比同类产品便宜太多了",
    "活动价买的，相当划算，功能一点不打折",
    "性价比之王，用了才知道多香",
    # 负面评论 - 产品质量
    "用了三天就开始起皮，质量有点差",
    "和图片描述不符，实物颜色差很多，很失望",
    "包装粗糙，感觉不像正品，有些担心",
    "效果一般，不如之前用的那款，有点后悔",
    "味道有点奇怪，不知道是不是我个人问题",
    "用了一个月没效果，感觉在交智商税",
    "质量越来越差了，以前买的比现在好很多",
    "有色差，实物没有图片好看",
    # 负面评论 - 物流
    "等了快两周才到，物流太慢了，客服也不管",
    "包装破损，里面的产品都漏了，很心疼",
    "快递丢件了，联系了好多次才解决，太麻烦了",
    "物流显示已收货但我没收到，很着急",
    "发货太慢，下单一周还没发货，催了好几次",
    # 负面评论 - 客服
    "客服态度很差，问问题爱答不理的",
    "申请退款好难，客服一直推诿责任",
    "有问题找客服，说了半天没解决，很烦",
    "售后太慢了，反映问题三天了没有回音",
    # 负面评论 - 价格
    "买完第二天就降价了，心态崩了",
    "感觉虚标价格，折扣水分很大",
    "同款产品别家便宜很多，感觉被坑了",
    # 中性评论
    "产品中规中矩，没有特别惊艳的地方",
    "还好吧，比预期稍微好一点点",
    "凑合用，不算好也不算差",
    "一般般，不会特别推荐但也不会说差",
    "价格适中，质量也就这样",
    "包装普通，产品还行",
    "第一次用这个牌子，感觉还可以",
    "朋友推荐的，觉得一般般，可能是我要求高",
    "用着没特别感受，也没遇到什么问题",
    "和预期差不多，没惊喜也没失望",
]

# 扩展到200条（重复+变体）
_EXTRA_POSITIVE = [
    "真的很好用！效果超棒，已经推荐给所有朋友了",
    "超级满意！比我预期的好太多",
    "发现宝藏产品了！以后要一直买这家的",
    "颜值在线，品质也很棒，拍照超好看",
    "用完整瓶，效果肉眼可见，非常推荐",
    "包装很有心意，送礼也很合适",
    "终于找到适合自己的了，开心！",
    "回购第五次了，真的离不开",
    "全网最好用的同类产品，没有之一",
    "闺蜜都来问我用的什么，太有面子了",
]
_EXTRA_NEGATIVE = [
    "差评！完全名不副实，要求退款",
    "质量太差了，用一次就坏了",
    "这个价格买到这个质量，太失望了",
    "已经差评了，不建议大家买",
    "买回来发现是翻新品，非常愤怒",
    "根本没有宣传的效果，骗人的",
    "发货速度极慢，客服也不负责任",
    "收到的和图片完全不一样，投诉了",
]

FULL_COMMENTS = (
    MOCK_COMMENTS * 3
    + _EXTRA_POSITIVE * 5
    + _EXTRA_NEGATIVE * 4
)
# 打乱顺序，保持自然感
random.seed(42)
random.shuffle(FULL_COMMENTS)
FULL_COMMENTS = FULL_COMMENTS[:200]

# 为演示生成带时间戳的数据
def get_sample_data() -> dict:
    """返回模拟舆情数据集"""
    comments_with_meta = []
    base_dates = [
        "2024-03-01", "2024-03-02", "2024-03-03", "2024-03-04",
        "2024-03-05", "2024-03-06", "2024-03-07",
    ]
    platforms = ["小红书", "微博", "淘宝评论", "抖音评论", "京东评论"]

    for i, text in enumerate(FULL_COMMENTS):
        comments_with_meta.append({
            "id": i + 1,
            "text": text,
            "platform": platforms[i % len(platforms)],
            "date": base_dates[i % len(base_dates)],
            "likes": random.randint(0, 500),
        })

    return {
        "total": len(comments_with_meta),
        "comments": comments_with_meta,
        "date_range": {"start": "2024-03-01", "end": "2024-03-07"},
        "brand": "示例品牌",
    }


ANALYSIS_PROMPT = """你是一名专业的品牌舆情分析师。请对以下用户评论进行系统性分析。

评论总数：{total}条
评论样本（随机抽取{sample_size}条）：
{comments_text}

请完成以下分析任务，返回严格的JSON格式：
{{
  "sentiment_stats": {{
    "positive": 正面评论百分比(整数),
    "negative": 负面评论百分比(整数),
    "neutral": 中性评论百分比(整数)
  }},
  "topics": [
    {{
      "name": "话题名称（4-6字）",
      "count": 涉及评论数量(整数),
      "sentiment": "positive/negative/neutral",
      "representative": "最典型的1条评论"
    }}
  ],
  "negative_issues": [
    {{
      "category": "问题类别",
      "proportion": 占负面评论的百分比(整数),
      "severity": "high/medium/low",
      "action": "建议改善措施（15字内）"
    }}
  ],
  "daily_trend": [
    {{"date": "MM-DD", "positive": 数值, "negative": 数值, "neutral": 数值}}
  ],
  "overall_score": 品牌口碑综合评分(0-100),
  "key_insight": "最重要的舆情洞察（2句话）",
  "alert": {{
    "triggered": true或false,
    "reason": "预警原因（如有）"
  }}
}}

只返回JSON，不要有其他内容。"""


async def analyze_sentiment_stream(
    comments: list[str],
    brand_name: str = "示例品牌",
) -> AsyncGenerator[dict, None]:
    """流式情感分析"""
    client = get_llm_client()
    model = get_model_name()

    yield {"type": "progress", "step": "正在加载评论数据...", "percent": 10}
    await _async_sleep(0.3)

    yield {"type": "progress", "step": "正在进行语义分析...", "percent": 30}
    await _async_sleep(0.3)

    # 取样本用于LLM分析
    sample_size = min(60, len(comments))
    sample = random.sample(comments, sample_size)
    comments_text = "\n".join([f"{i+1}. {c}" for i, c in enumerate(sample)])

    yield {"type": "progress", "step": "大模型深度分析中...", "percent": 60}

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": ANALYSIS_PROMPT.format(
                        total=len(comments),
                        sample_size=sample_size,
                        comments_text=comments_text,
                    ),
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2000,
        )
        result = json.loads(resp.choices[0].message.content)
    except Exception as e:
        result = _fallback_analysis()

    yield {"type": "progress", "step": "生成可视化数据...", "percent": 90}
    await _async_sleep(0.2)

    # 补全7天趋势数据（如果LLM没有生成）
    if not result.get("daily_trend") or len(result["daily_trend"]) < 7:
        result["daily_trend"] = _generate_trend_data(result.get("sentiment_stats", {}))

    yield {"type": "done", "data": result}


async def _async_sleep(seconds: float):
    import asyncio
    await asyncio.sleep(seconds)


def _fallback_analysis() -> dict:
    return {
        "sentiment_stats": {"positive": 58, "negative": 22, "neutral": 20},
        "topics": [
            {"name": "产品效果好", "count": 45, "sentiment": "positive", "representative": "用了两个月效果很明显，皮肤水润了很多"},
            {"name": "物流配送慢", "count": 28, "sentiment": "negative", "representative": "等了快两周才到，物流太慢了"},
            {"name": "性价比高", "count": 35, "sentiment": "positive", "representative": "这个价格真的良心，比同类产品便宜太多了"},
            {"name": "客服体验", "count": 22, "sentiment": "negative", "representative": "客服态度很差，问问题爱答不理的"},
            {"name": "包装质量", "count": 18, "sentiment": "neutral", "representative": "包装普通，产品还行"},
            {"name": "回购意愿强", "count": 40, "sentiment": "positive", "representative": "一直在回购的产品，效果稳定"},
        ],
        "negative_issues": [
            {"category": "物流配送", "proportion": 38, "severity": "high", "action": "优化仓储配送时效"},
            {"category": "客服响应", "proportion": 28, "severity": "high", "action": "加强客服培训"},
            {"category": "产品质量", "proportion": 22, "severity": "medium", "action": "加强质检标准"},
            {"category": "价格感知", "proportion": 12, "severity": "low", "action": "优化促销策略"},
        ],
        "daily_trend": _generate_trend_data({"positive": 58, "negative": 22, "neutral": 20}),
        "overall_score": 72,
        "key_insight": "品牌产品口碑良好，但物流和客服体验是当前最大痛点，建议优先改善配送时效。",
        "alert": {"triggered": False, "reason": ""},
    }


def _generate_trend_data(stats: dict) -> list:
    dates = ["03-01", "03-02", "03-03", "03-04", "03-05", "03-06", "03-07"]
    base_pos = stats.get("positive", 58)
    base_neg = stats.get("negative", 22)
    base_neu = stats.get("neutral", 20)
    trend = []
    for i, d in enumerate(dates):
        noise = random.randint(-5, 5)
        # 03-05 制造一个负面波动（演示预警）
        if d == "03-05":
            trend.append({"date": d, "positive": base_pos - 12, "negative": base_neg + 15, "neutral": base_neu - 3})
        else:
            trend.append({
                "date": d,
                "positive": max(0, base_pos + noise),
                "negative": max(0, base_neg - noise // 2),
                "neutral": max(0, base_neu + noise // 3),
            })
    return trend
