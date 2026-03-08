"""案例6：智能推荐与用户分层服务"""
from __future__ import annotations
import json
import random
from typing import AsyncGenerator, List, Optional
from services.llm_client import get_llm_client, get_model_name

random.seed(99)

# 模拟用户数据
MOCK_USERS = [
    {"id": "U001", "name": "林小雅", "age": 22, "gender": "女", "city": "上海", "segment": "学生党", "avg_order": 89, "purchase_freq": 3, "top_categories": ["美妆", "零食", "文具"], "style_pref": "可爱少女", "price_sensitivity": "高", "review_keywords": ["平价", "好用", "颜值高", "学生党必备"]},
    {"id": "U002", "name": "张伟强", "age": 35, "gender": "男", "city": "北京", "segment": "商务精英", "avg_order": 680, "purchase_freq": 5, "top_categories": ["数码", "服装", "健身"], "style_pref": "商务简约", "price_sensitivity": "低", "review_keywords": ["品质", "专业", "效率", "高端"]},
    {"id": "U003", "name": "王丽华", "age": 31, "gender": "女", "city": "广州", "segment": "精致白领", "avg_order": 320, "purchase_freq": 8, "top_categories": ["护肤", "服装", "家居"], "style_pref": "精致轻奢", "price_sensitivity": "中", "review_keywords": ["质感", "精致", "值得", "提升气质"]},
    {"id": "U004", "name": "赵大海", "age": 45, "gender": "男", "city": "成都", "segment": "家庭用户", "avg_order": 245, "purchase_freq": 6, "top_categories": ["家电", "食品", "日用"], "style_pref": "实用耐用", "price_sensitivity": "中", "review_keywords": ["实用", "耐用", "家用", "性价比"]},
    {"id": "U005", "name": "陈晓晨", "age": 27, "gender": "女", "city": "杭州", "segment": "潮流达人", "avg_order": 420, "purchase_freq": 12, "top_categories": ["服装", "美妆", "潮玩"], "style_pref": "潮流个性", "price_sensitivity": "低", "review_keywords": ["潮", "独特", "限定", "ins风"]},
    {"id": "U006", "name": "李明远", "age": 29, "gender": "男", "city": "深圳", "segment": "数码发烧友", "avg_order": 1200, "purchase_freq": 4, "top_categories": ["数码", "电脑", "相机"], "style_pref": "科技前沿", "price_sensitivity": "低", "review_keywords": ["性能", "参数", "专业", "最新款"]},
    {"id": "U007", "name": "吴婷婷", "age": 33, "gender": "女", "city": "武汉", "segment": "宝妈群体", "avg_order": 185, "purchase_freq": 10, "top_categories": ["母婴", "食品", "教育"], "style_pref": "安全健康", "price_sensitivity": "高", "review_keywords": ["安全", "天然", "宝宝用", "妈妈推荐"]},
    {"id": "U008", "name": "刘海涛", "age": 52, "gender": "男", "city": "西安", "segment": "中老年用户", "avg_order": 160, "purchase_freq": 3, "top_categories": ["保健", "服装", "家居"], "style_pref": "舒适保健", "price_sensitivity": "高", "review_keywords": ["舒适", "保健", "中老年适合", "子女推荐"]},
]

# 模拟商品数据
MOCK_PRODUCTS = [
    {"id": "P001", "name": "玻尿酸补水面膜", "category": "美妆护肤", "price": 69, "original_price": 139, "rating": 96, "sales": 50000, "selling_points": "深层补水、温和无刺激、医研级配方", "review_keywords": ["补水效果好", "温和不刺激", "皮肤变水润"]},
    {"id": "P002", "name": "商务真皮公文包", "category": "箱包配件", "price": 580, "original_price": 980, "rating": 94, "sales": 3200, "selling_points": "头层牛皮、多隔层设计、15.6寸笔记本可放", "review_keywords": ["做工精良", "很有质感", "商务场合撑场面"]},
    {"id": "P003", "name": "空气炸锅 4.5L", "category": "厨房电器", "price": 299, "original_price": 499, "rating": 92, "sales": 28000, "selling_keywords": "无油健康、大容量、快速加热", "selling_points": "无油健康、4.5L大容量、一键操作", "review_keywords": ["做出来很好吃", "省油健康", "家庭必备"]},
    {"id": "P004", "name": "潮流印花T恤", "category": "服装", "price": 158, "original_price": 298, "rating": 89, "sales": 15000, "selling_points": "设计师联名款、纯棉材质、ins爆款同款", "review_keywords": ["上身效果好", "很潮", "拍照好看"]},
    {"id": "P005", "name": "索尼降噪耳机", "category": "数码", "price": 1299, "original_price": 1999, "rating": 97, "sales": 8800, "selling_points": "行业顶级主动降噪、30小时续航、LDAC高清音质", "review_keywords": ["降噪效果绝了", "音质很棒", "码农必备"]},
    {"id": "P006", "name": "有机婴儿米粉", "category": "母婴", "price": 89, "original_price": 129, "rating": 95, "sales": 32000, "selling_points": "有机认证、添加DHA、6月龄适用", "review_keywords": ["宝宝爱吃", "有机放心", "营养全面"]},
    {"id": "P007", "name": "颈椎按摩仪", "category": "保健", "price": 349, "original_price": 699, "rating": 91, "sales": 18000, "selling_points": "3D仿人手按揉、热敷功能、无线便携", "review_keywords": ["上班族必备", "颈椎缓解明显", "老人适合"]},
    {"id": "P008", "name": "限定联名帆布包", "category": "箱包配件", "price": 228, "original_price": 328, "rating": 88, "sales": 5600, "selling_points": "设计师限定联名、环保帆布、多色可选", "review_keywords": ["很有个性", "限定款独特", "颜值超高"]},
]

REASON_PROMPT_WITH_AI = """根据用户画像，为该用户生成1句个性化推荐理由（20-25字，自然口语化，突出与该用户最相关的价值点）。

用户信息：
- 用户群体：{segment}
- 年龄：{age}岁，{gender}
- 消费偏好：{top_categories}
- 价格敏感度：{price_sensitivity}
- 用户常提及：{review_keywords}

推荐商品：
- 名称：{product_name}
- 核心卖点：{selling_points}
- 用户好评关键词：{product_keywords}

只输出推荐理由这一句话，不要任何前缀。"""

SEGMENT_PROMPT = """请基于以下用户特征总结，为这个用户群体生成营销标签和策略。

用户群体特征：
{features}

返回JSON：
{{"label": "群体标签（4-6字）", "description": "核心特征描述（2句话）", "strategy": ["营销策略1（15字内）", "营销策略2（15字内）"]}}"""


async def get_recommendation_with_reason(
    user: dict,
    product: dict,
    mode: str = "with_ai",
) -> dict:
    """为用户生成推荐理由"""
    if mode == "without_ai":
        return {
            "mode": "without_ai",
            "reason": f"热销推荐：{product['name']}，好评率{product['rating']}%，{product['sales']}人已购",
            "product": product,
        }

    client = get_llm_client()
    model = get_model_name()

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": REASON_PROMPT_WITH_AI.format(
                        segment=user["segment"],
                        age=user["age"],
                        gender=user["gender"],
                        top_categories="、".join(user["top_categories"]),
                        price_sensitivity=user["price_sensitivity"],
                        review_keywords="、".join(user["review_keywords"]),
                        product_name=product["name"],
                        selling_points=product["selling_points"],
                        product_keywords="、".join(product["review_keywords"]),
                    ),
                }
            ],
            temperature=0.5,
            max_tokens=80,
        )
        reason = resp.choices[0].message.content.strip()
    except Exception:
        reason = f"专为{user['segment']}精选：{product['selling_points'].split('、')[0]}，{user['review_keywords'][0]}好评验证"

    return {
        "mode": "with_ai",
        "reason": reason,
        "product": product,
    }


async def batch_recommend_stream(
    user_id: str,
    product_ids: list[str],
) -> AsyncGenerator[dict, None]:
    """批量生成推荐对比（无AI vs 有AI）"""
    user = next((u for u in MOCK_USERS if u["id"] == user_id), MOCK_USERS[0])
    products = [p for p in MOCK_PRODUCTS if p["id"] in product_ids]

    if not products:
        products = MOCK_PRODUCTS[:4]

    yield {"type": "start", "user": user, "total": len(products)}

    for product in products:
        # 无AI版本
        no_ai = await get_recommendation_with_reason(user, product, mode="without_ai")
        # 有AI版本
        with_ai = await get_recommendation_with_reason(user, product, mode="with_ai")

        yield {
            "type": "item",
            "product_id": product["id"],
            "product_name": product["name"],
            "no_ai_reason": no_ai["reason"],
            "ai_reason": with_ai["reason"],
            "product": product,
        }

    yield {"type": "done"}


def get_users() -> list[dict]:
    return MOCK_USERS


def get_products() -> list[dict]:
    return MOCK_PRODUCTS


async def get_user_segments() -> list[dict]:
    """返回用户分层结果（预计算，演示用）"""
    segments = {}
    for user in MOCK_USERS:
        seg = user["segment"]
        if seg not in segments:
            segments[seg] = {
                "label": seg,
                "users": [],
                "color": _get_segment_color(seg),
            }
        segments[seg]["users"].append(user)

    result = []
    for seg_name, seg_data in segments.items():
        users = seg_data["users"]
        avg_order = sum(u["avg_order"] for u in users) / len(users)
        result.append({
            "label": seg_name,
            "count": len(users),
            "avg_order": round(avg_order),
            "color": seg_data["color"],
            "sample_users": [u["name"] for u in users],
            "top_categories": list(set(cat for u in users for cat in u["top_categories"]))[:3],
            "price_sensitivity": users[0]["price_sensitivity"],
        })

    return result


def _get_segment_color(segment: str) -> str:
    colors = {
        "学生党": "#6366f1",
        "商务精英": "#0ea5e9",
        "精致白领": "#ec4899",
        "家庭用户": "#f59e0b",
        "潮流达人": "#8b5cf6",
        "数码发烧友": "#10b981",
        "宝妈群体": "#f97316",
        "中老年用户": "#64748b",
    }
    return colors.get(segment, "#6b7280")
