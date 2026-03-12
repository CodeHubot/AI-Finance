"""案例12：高校学术研究助手服务"""
from __future__ import annotations
import json
from typing import AsyncGenerator
from services.llm_client import get_llm_client, get_model_name

RESEARCH_DIRECTIONS = [
    "人工智能与教育技术",
    "大数据与用户行为分析",
    "新能源材料与储能技术",
    "碳中和与绿色经济",
    "数字经济与平台治理",
    "社会心理学与网络行为",
    "生物医学与精准医疗",
    "城市化与乡村振兴",
]

SAMPLE_ABSTRACTS = """
[论文1] 基于深度学习的个性化推荐系统研究综述
本文系统梳理了近十年深度学习在推荐系统中的应用进展，重点分析了协同过滤、
内容过滤和混合推荐三类方法的优劣势，并探讨了冷启动、数据稀疏性等核心挑战。

[论文2] 大语言模型在智能教育中的应用现状与展望
本文综述了ChatGPT等大语言模型在个性化学习、自动批改、教学设计等场景的
应用案例，分析了数据隐私、学术诚信等伦理挑战，并对未来发展方向进行了展望。

[论文3] 教育技术接受行为的影响因素实证研究
基于TAM模型，本文通过问卷调查研究了1200名高校学生对AI学习工具的接受行为，
发现感知有用性、易用性和社会影响是主要影响因素。
"""

LITERATURE_PROMPT = """你是一名资深学术导师，正在指导研究生进行文献综述和研究设计。

研究主题：{topic}
研究问题：{research_question}
研究方向：{direction}
已有文献摘要（如有）：
{abstracts}

请提供系统性的学术研究辅助，返回JSON：
{{
  "research_landscape": {{
    "overview": "该研究方向的整体发展状况（3-4句）",
    "key_schools": ["主要研究流派/视角1", "主要研究流派/视角2", "主要研究流派/视角3"],
    "hot_topics": ["当前热点议题1", "当前热点议题2", "当前热点议题3"],
    "research_gaps": ["研究空白/不足1", "研究空白/不足2", "研究空白/不足3"]
  }},
  "paper_structure": {{
    "title_suggestions": ["论文题目建议1（突出研究视角）", "论文题目建议2（突出研究对象）"],
    "abstract_framework": "摘要结构建议（研究背景/目的/方法/结论各几句）",
    "chapters": [
      {{"chapter": "章节名称", "content_points": ["内容要点1", "内容要点2"], "pages": "建议字数/页数"}}
    ]
  }},
  "methodology": {{
    "recommended_methods": [
      {{"method": "研究方法名称", "applicability": "适用场景", "tools": ["工具/软件"], "strength": "优势"}}
    ],
    "data_sources": ["数据来源建议1", "数据来源建议2"],
    "analysis_framework": "分析框架建议"
  }},
  "key_arguments": [
    {{"argument": "核心论点", "supporting_logic": "支撑逻辑", "potential_counter": "可能的反驳及应对"}}
  ],
  "literature_reading_strategy": {{
    "must_read_types": ["必读文献类型1（如：开创性研究）", "必读文献类型2"],
    "search_keywords": ["检索关键词1（中文）", "search keyword 2 (English)", "检索关键词3"],
    "databases": ["CNKI", "Web of Science", "Google Scholar", "其他推荐数据库"]
  }},
  "timeline": [
    {{"phase": "阶段名称", "duration": "建议时长", "deliverable": "阶段产出物"}}
  ],
  "writing_tips": ["学术写作建议1", "学术写作建议2", "学术写作建议3"]
}}

只返回JSON。"""

WRITING_CHECK_PROMPT = """你是一名严格的学术写作导师，正在审阅学生的论文片段。

论文类型：{paper_type}
提交片段：
{text}

请从以下维度进行学术规范检查，返回JSON：
{{
  "overall_score": 学术质量综合分（0-100），
  "dimension_scores": [
    {{"dimension": "维度名称", "score": 分数, "full_score": 满分, "feedback": "具体反馈"}}
  ],
  "issues": [
    {{"type": "问题类型（逻辑/表述/规范/引用等）", "location": "问题所在句子或段落", "suggestion": "修改建议"}}
  ],
  "strengths": ["写作亮点1", "写作亮点2"],
  "revised_example": "对其中一处问题的修改示例（选最典型的一处）",
  "overall_advice": "整体改进建议（50字内）"
}}

只返回JSON。"""


async def analyze_research_stream(
    topic: str,
    research_question: str,
    direction: str,
    abstracts: str = "",
) -> AsyncGenerator[dict, None]:
    """流式生成研究分析"""
    client = get_llm_client()
    model = get_model_name()
    import asyncio

    yield {"type": "progress", "step": "梳理研究领域图谱...", "percent": 20}
    await asyncio.sleep(0.3)

    yield {"type": "progress", "step": "分析研究空白...", "percent": 50}

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": LITERATURE_PROMPT.format(
                topic=topic,
                research_question=research_question or f"{topic}领域的核心问题探讨",
                direction=direction,
                abstracts=abstracts or "暂无已有文献摘要",
            )}],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=3000,
        )
        result = json.loads(resp.choices[0].message.content)
    except Exception:
        result = _fallback_research(topic)

    yield {"type": "progress", "step": "生成研究框架建议...", "percent": 90}
    await asyncio.sleep(0.2)

    yield {"type": "done", "data": result}


async def check_writing_stream(
    text: str,
    paper_type: str = "学术论文",
) -> AsyncGenerator[dict, None]:
    """流式检查学术写作质量"""
    client = get_llm_client()
    model = get_model_name()
    import asyncio

    yield {"type": "progress", "step": "分析学术规范...", "percent": 30}

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": WRITING_CHECK_PROMPT.format(
                paper_type=paper_type,
                text=text[:2000],
            )}],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000,
        )
        result = json.loads(resp.choices[0].message.content)
    except Exception:
        result = {
            "overall_score": 72,
            "dimension_scores": [
                {"dimension": "逻辑严密性", "score": 18, "full_score": 25, "feedback": "论证基本合理，部分论点需加强支撑"},
                {"dimension": "语言规范性", "score": 20, "full_score": 25, "feedback": "整体较规范，个别表达口语化"},
                {"dimension": "引用规范", "score": 16, "full_score": 25, "feedback": "引用不够充分，需增加文献支撑"},
                {"dimension": "结构完整性", "score": 18, "full_score": 25, "feedback": "结构基本完整，层次较清晰"},
            ],
            "issues": [
                {"type": "表述", "location": "第一段", "suggestion": "避免使用模糊词汇如'很多'，改为具体数据"},
                {"type": "引用", "location": "核心论点处", "suggestion": "核心论点需添加文献引用支撑"},
            ],
            "strengths": ["主题明确，研究价值清晰", "段落结构较为规整"],
            "revised_example": "原文：'很多研究表明...' → 修改：'多项实证研究（Smith, 2023; 李明, 2022）表明...'",
            "overall_advice": "建议增加文献引用密度，核心论点均需有文献支撑，同时注意避免口语化表达。",
        }

    yield {"type": "progress", "step": "完成检查...", "percent": 100}
    await asyncio.sleep(0.1)
    yield {"type": "done", "data": result}


def _fallback_research(topic: str) -> dict:
    return {
        "research_landscape": {
            "overview": f"{topic}领域近年来受到学界广泛关注，相关研究呈快速增长趋势，形成了多个主要研究方向。",
            "key_schools": ["实证研究取向", "理论建构取向", "应用实践取向"],
            "hot_topics": ["数字化转型", "可持续发展", "跨学科整合"],
            "research_gaps": ["纵向追踪研究不足", "本土情境研究有待加强", "理论与实践结合需深化"],
        },
        "paper_structure": {
            "title_suggestions": [f"{topic}的影响机制研究——基于实证视角", f"{topic}理论模型构建与验证"],
            "abstract_framework": "背景1句+目的1句+方法2句+发现2句+贡献1句",
            "chapters": [
                {"chapter": "引言", "content_points": ["研究背景", "研究问题", "研究意义"], "pages": "1500字"},
                {"chapter": "文献综述", "content_points": ["理论基础", "相关研究回顾", "研究空白"], "pages": "3000字"},
                {"chapter": "研究设计", "content_points": ["研究方法", "数据收集", "分析框架"], "pages": "2000字"},
                {"chapter": "结果与讨论", "content_points": ["主要发现", "结果讨论", "理论贡献"], "pages": "4000字"},
                {"chapter": "结论", "content_points": ["研究总结", "实践启示", "研究局限与展望"], "pages": "1500字"},
            ],
        },
        "methodology": {
            "recommended_methods": [
                {"method": "问卷调查法", "applicability": "大样本量化研究", "tools": ["SPSS", "Mplus"], "strength": "数据客观，便于统计分析"},
                {"method": "半结构访谈", "applicability": "深度质性探究", "tools": ["NVivo", "Atlas.ti"], "strength": "获取深层次意义"},
            ],
            "data_sources": ["公开数据库", "实地调研", "文献资料"],
            "analysis_framework": "建议采用混合研究方法，量质互补",
        },
        "key_arguments": [
            {"argument": "核心论点待确定", "supporting_logic": "需结合具体研究问题展开", "potential_counter": "注意控制混淆变量"},
        ],
        "literature_reading_strategy": {
            "must_read_types": ["开创性研究（奠基论文）", "近3年高被引论文", "综述类文章"],
            "search_keywords": [topic, f"{topic} research", f"{topic} mechanism"],
            "databases": ["CNKI", "Web of Science", "Google Scholar", "Scopus"],
        },
        "timeline": [
            {"phase": "文献阅读", "duration": "2-3周", "deliverable": "文献笔记与综述初稿"},
            {"phase": "研究设计", "duration": "1-2周", "deliverable": "研究方案"},
            {"phase": "数据收集", "duration": "3-4周", "deliverable": "原始数据"},
            {"phase": "分析写作", "duration": "4-6周", "deliverable": "论文初稿"},
            {"phase": "修改完善", "duration": "2-3周", "deliverable": "终稿"},
        ],
        "writing_tips": ["每段围绕一个中心论点展开", "论点-论据-论证三要素缺一不可", "引用要规范，避免抄袭"],
    }


def get_research_directions() -> list:
    return RESEARCH_DIRECTIONS


def get_sample_abstracts() -> str:
    return SAMPLE_ABSTRACTS
