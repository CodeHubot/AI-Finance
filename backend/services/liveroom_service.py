"""案例7：数字人直播智能导购服务"""
from __future__ import annotations
import json
from typing import AsyncGenerator, List, Dict, Optional
from services.llm_client import get_llm_client, get_model_name

# 模拟商品知识库
PRODUCT_CATALOG = [
    {
        "id": "SKU001",
        "name": "轻薄防晒衣 UPF50+",
        "price": 129,
        "original_price": 259,
        "stock": 328,
        "category": "防晒服饰",
        "description": "冰感面料，隔热降温，UPF50+专业防紫外线，重量仅90g",
        "specs": "颜色：白/粉/蓝/绿，尺码：XS-XXL",
        "faq": [
            {"q": "防晒效果怎么样？", "a": "UPF50+认证，可以阻隔98%以上的紫外线，户外活动、通勤、骑行都非常适合。"},
            {"q": "会不会很热？", "a": "采用冰感降温面料，实测穿着比不穿温度低2-3°C，非常透气，完全不会闷热。"},
            {"q": "能水洗吗？", "a": "可以机洗，建议用洗衣袋，不会掉色，洗100次防晒效果依然有效。"},
            {"q": "有没有口袋？", "a": "两侧各有一个隐藏式口袋，可以放手机和钥匙，非常方便。"},
            {"q": "多大码？", "a": "XS到XXL都有，推荐参考身高体重选码，也可以留言客服帮您推荐。"},
        ],
        "promotion": "今日直播专属价129元（原价259），前100名送冰袖，下单送小样",
    },
    {
        "id": "SKU002",
        "name": "玻尿酸补水精华液",
        "price": 189,
        "original_price": 368,
        "stock": 156,
        "category": "护肤品",
        "description": "三重玻尿酸配方，深层补水锁水，改善干纹，28天肌肤焕活",
        "specs": "规格：30ml，适合所有肤质，孕妇可用",
        "faq": [
            {"q": "适合油皮吗？", "a": "非常适合！轻薄水感质地，吸收快不油腻，油皮用完清爽，干皮用完水润，真的所有肤质都适合。"},
            {"q": "敏感肌可以用吗？", "a": "配方温和无香精无酒精，通过了皮肤科敏感测试，敏感肌可以放心使用，孕妇也可以用。"},
            {"q": "多久能看到效果？", "a": "一般7天能感受到皮肤水润度改善，28天干纹明显淡化，坚持用完一瓶效果最好。"},
            {"q": "怎么用？", "a": "洁面爽肤水之后，取3-4滴按压全脸，轻轻拍打至吸收，早晚都可以用。"},
            {"q": "能和其他精华叠加吗？", "a": "可以，建议先用质地较薄的（比如本品），再用质地较厚的，吸收效果最好。"},
        ],
        "promotion": "直播特价189元买一送一（原价368/瓶），送完为止",
    },
    {
        "id": "SKU003",
        "name": "无线降噪蓝牙耳机",
        "price": 399,
        "original_price": 799,
        "stock": 88,
        "category": "数码配件",
        "description": "主动降噪40dB，续航30小时，10分钟快充续航2小时，轻量设计仅230g",
        "specs": "颜色：黑/白/星空灰，附赠收纳包",
        "faq": [
            {"q": "降噪效果好吗？", "a": "主动降噪可达40dB，地铁、咖啡厅、办公室噪音基本都能屏蔽，比市面同价位强很多。"},
            {"q": "续航多久？", "a": "单次续航30小时，支持10分钟快充续航2小时，配合充电盒总续航90小时，一周充一次够了。"},
            {"q": "通话清晰吗？", "a": "六麦克风阵列+AI降噪算法，在嘈杂环境里对方也能听清楚，视频会议完全没问题。"},
            {"q": "适合运动吗？", "a": "头戴式设计，运动时稍微不太方便，更推荐日常通勤、学习、办公场景使用。"},
            {"q": "可以同时连两台设备吗？", "a": "支持双设备同时连接，手机和电脑可以同时配对，切换非常方便。"},
        ],
        "promotion": "今日直播399元（原价799），送收纳包，30天无理由退换",
    },
]

# 构建知识库文本（用于检索）
def _build_knowledge_chunks() -> list[dict]:
    chunks = []
    for product in PRODUCT_CATALOG:
        # 产品基础信息块
        chunks.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "type": "basic",
            "content": f"商品名称：{product['name']}\n价格：{product['price']}元（原价{product['original_price']}元）\n库存：{product['stock']}件\n描述：{product['description']}\n规格：{product['specs']}\n促销：{product['promotion']}"
        })
        # FAQ问答块
        for qa in product["faq"]:
            chunks.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "type": "faq",
                "content": f"关于{product['name']}的问答——问：{qa['q']} 答：{qa['a']}"
            })
    return chunks


KNOWLEDGE_CHUNKS = _build_knowledge_chunks()


def _simple_retrieve(query: str, top_k: int = 3) -> list[dict]:
    """简单关键词检索（演示用，生产环境应使用向量检索）"""
    query_lower = query.lower()
    scored = []
    for chunk in KNOWLEDGE_CHUNKS:
        score = 0
        content_lower = chunk["content"].lower()
        # 简单关键词匹配打分
        for word in query_lower:
            if word in content_lower:
                score += 1
        # 产品名称匹配加权
        if chunk["product_name"] in query:
            score += 5
        if chunk["type"] == "faq":
            score += 1
        scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:top_k] if _ > 0]


ANCHOR_SYSTEM_PROMPT = """你是「小美」，{brand}官方直播间的AI主播助手。
性格特点：热情亲切、专业可信、适度促销但不强迫

当前直播商品：{current_products}

直播规则：
1. 如果用户询问商品信息（价格/效果/规格等），优先基于知识库准确回答
2. 如果是闲聊（感谢/打招呼）,简短热情回应，不超过15字
3. 如果用户犹豫购买，适当强调活动限时性（"今天直播专属价，明天就没了"）
4. 如果知识库中没有相关信息，诚实说"这个问题我帮您确认一下"
5. 回复控制在50字以内，节奏感强

知识库检索内容：
{retrieved_knowledge}

用户消息：{user_message}

请直接输出回复，不要任何前缀。"""


async def chat_stream(
    user_message: str,
    current_product_id: str = None,
    conversation_history: list = None,
) -> AsyncGenerator[dict, None]:
    """流式对话——数字人导购"""
    client = get_llm_client()
    model = get_model_name()

    # 检索相关知识
    retrieved = _simple_retrieve(user_message, top_k=3)
    retrieved_text = "\n---\n".join([c["content"] for c in retrieved]) if retrieved else "暂无相关产品信息"

    # 当前商品信息
    if current_product_id:
        current_product = next((p for p in PRODUCT_CATALOG if p["id"] == current_product_id), None)
        current_products_text = f"{current_product['name']}，售价{current_product['price']}元" if current_product else "全场商品"
    else:
        current_products_text = "、".join([f"{p['name']}({p['price']}元)" for p in PRODUCT_CATALOG])

    system_prompt = ANCHOR_SYSTEM_PROMPT.format(
        brand="星耀好物",
        current_products=current_products_text,
        retrieved_knowledge=retrieved_text,
        user_message=user_message,
    )

    # 流式输出
    yield {"type": "retrieval", "chunks": retrieved}

    full_response = ""
    stream = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.5,
        max_tokens=150,
        stream=True,
    )

    async for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        if token:
            full_response += token
            yield {"type": "token", "token": token}

    yield {"type": "done", "full_response": full_response}


def get_products() -> list[dict]:
    return PRODUCT_CATALOG


def get_knowledge_preview() -> list[dict]:
    """返回知识库预览（用于前端展示）"""
    return [
        {
            "product_id": p["id"],
            "product_name": p["name"],
            "price": p["price"],
            "faq_count": len(p["faq"]),
            "category": p["category"],
        }
        for p in PRODUCT_CATALOG
    ]
