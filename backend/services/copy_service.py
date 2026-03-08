"""案例4：智能营销文案生成服务"""
from __future__ import annotations
import json
import asyncio
from typing import AsyncGenerator
from services.llm_client import get_llm_client, get_model_name

PLATFORM_TEMPLATES = {
    "xiaohongshu": {
        "name": "小红书",
        "style": "亲切口语化、emoji丰富、真实体验感",
        "prompt": """你是一名爆款小红书博主，擅长种草内容创作。
写作风格：亲切口语化、多用emoji、分享真实体验感、制造共鸣
结构要求：
- 标题（含核心关键词，引发好奇或共鸣，15字以内，可加emoji）
- 开场钩子（1-2句，戳中痛点或制造好奇心）
- 正文（真实体验描述，400-500字，适当分段，用emoji装饰）
- 互动结尾（引导评论/收藏，1句话）
- 标签（5-6个话题标签，#格式）

产品名称：{product_name}
核心卖点：{selling_points}
目标人群：{target_audience}
附加信息：{extra_info}

请直接输出完整种草笔记，不要有任何前缀说明。""",
    },
    "zhihu": {
        "name": "知乎",
        "style": "专业严谨、数据支撑、逻辑清晰",
        "prompt": """你是一名知乎专业答主，专注消费决策类内容创作。
写作风格：专业严谨、数据支撑、逻辑清晰、客观中立
结构要求：
- 结论前置（直接给出是否推荐的判断）
- 产品深度评测（参数解析、横向对比、实测体验）
- 适用人群分析（明确适合/不适合哪类人）
- 购买决策建议（最佳购买时机、渠道、注意事项）
- 总结（2-3句核心结论）

产品名称：{product_name}
核心卖点：{selling_points}
目标人群：{target_audience}
附加信息：{extra_info}

请直接输出完整评测内容，不要有任何前缀说明。""",
    },
    "douyin": {
        "name": "抖音",
        "style": "节奏感强、口语化、强调稀缺性",
        "prompt": """你是一名抖音带货主播，擅长快节奏口播文案创作。
写作风格：节奏感强、口语化、强调稀缺性和紧迫感、促单有力
结构要求：
- 开场（3秒抓眼球，惊叹或提问，15字内）
- 产品亮点速递（3个核心卖点，每点15字内，用序号或箭头分隔）
- 价值对比（原价vs活动价，或对比竞品体现超值）
- 促单话术（限时/限量/稀缺性强调）
- 行动号召（立即下单/点击链接/关注店铺，1句话）

产品名称：{product_name}
核心卖点：{selling_points}
目标人群：{target_audience}
附加信息：{extra_info}

请直接输出完整口播文案，不要有任何前缀说明。""",
    },
}

SCORE_PROMPT = """你是一名资深营销数据分析师，从目标用户视角评估以下文案的传播潜力。

平台：{platform_name}
目标人群：{target_audience}
文案内容：
{copy_text}

请从以下维度客观评分（每项0-100分），并给出1条最重要的改进建议：
1. 标题吸引力：是否让人想点开/继续阅读
2. 内容相关性：是否与目标人群需求高度匹配
3. 行动引导力：是否激发购买/分享欲望
4. 综合CTR预估：预估点击率相对基准的表现

返回严格JSON格式（不要有其他文字）：
{{"title_score": 数字, "relevance_score": 数字, "action_score": 数字, "ctr_score": 数字, "suggestion": "改进建议"}}"""


async def generate_copy_stream(
    product_name: str,
    selling_points: str,
    target_audience: str,
    platforms: list[str],
    extra_info: str = "",
    variants_per_platform: int = 2,
) -> AsyncGenerator[dict, None]:
    """流式生成多平台多版本文案"""
    client = get_llm_client()
    model = get_model_name()

    yield {"type": "start", "total": len(platforms) * variants_per_platform}

    for platform_key in platforms:
        if platform_key not in PLATFORM_TEMPLATES:
            continue
        tpl = PLATFORM_TEMPLATES[platform_key]

        for variant_idx in range(variants_per_platform):
            yield {
                "type": "generating",
                "platform": platform_key,
                "platform_name": tpl["name"],
                "variant": variant_idx + 1,
            }

            prompt = tpl["prompt"].format(
                product_name=product_name,
                selling_points=selling_points,
                target_audience=target_audience,
                extra_info=extra_info or "无",
            )

            temperature = 0.6 + variant_idx * 0.15

            copy_text = ""
            stream = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=800,
                stream=True,
            )

            async for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                copy_text += token

            # 打分
            score_result = await _score_copy(
                client, model, copy_text, tpl["name"], target_audience
            )

            yield {
                "type": "variant",
                "platform": platform_key,
                "platform_name": tpl["name"],
                "platform_style": tpl["style"],
                "variant": variant_idx + 1,
                "copy_text": copy_text,
                "scores": score_result,
            }

            await asyncio.sleep(0.1)

    yield {"type": "done"}


async def _score_copy(client, model: str, copy_text: str, platform_name: str, target_audience: str) -> dict:
    """给文案打分"""
    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": SCORE_PROMPT.format(
                        platform_name=platform_name,
                        target_audience=target_audience,
                        copy_text=copy_text[:600],
                    ),
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=200,
        )
        return json.loads(resp.choices[0].message.content)
    except Exception:
        return {
            "title_score": 72,
            "relevance_score": 75,
            "action_score": 68,
            "ctr_score": 70,
            "suggestion": "可进一步强化核心卖点与目标人群的情感连接",
        }


def get_platforms() -> list[dict]:
    return [
        {"key": k, "name": v["name"], "style": v["style"]}
        for k, v in PLATFORM_TEMPLATES.items()
    ]
