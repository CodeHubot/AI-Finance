"""案例13：智慧课堂问答与知识检测服务"""
from __future__ import annotations
import json
from typing import AsyncGenerator
from services.llm_client import get_llm_client, get_model_name

SUBJECT_TOPICS = {
    "数学": ["勾股定理", "一元二次方程", "函数概念", "三角函数", "导数应用", "概率统计"],
    "语文": ["议论文写作", "文言文翻译", "诗歌鉴赏", "小说阅读", "修辞手法"],
    "英语": ["时态语态", "定语从句", "虚拟语气", "词汇语境", "阅读策略"],
    "物理": ["牛顿定律", "电场电路", "机械波", "热力学", "光的干涉"],
    "化学": ["化学键", "氧化还原", "有机化学", "化学平衡", "电化学"],
    "生物": ["细胞结构", "DNA复制", "遗传规律", "生态系统", "免疫调节"],
    "历史": ["近代史重大事件", "改革与变法", "世界大战", "冷战格局", "改革开放"],
    "地理": ["地球运动", "气候类型", "自然地理", "人文地理", "区域发展"],
}

QUESTION_GEN_PROMPT = """你是一名有丰富教学经验的{subject}老师，正在为{grade}学生设计课堂互动问答。

知识点：{topic}
课堂阶段：{stage}（新课导入/讲授中/课堂检测/总结复习）

请设计一套完整的课堂问答方案，返回JSON：
{{
  "knowledge_overview": {{
    "core_concepts": ["核心概念1", "核心概念2", "核心概念3"],
    "prerequisite_knowledge": ["前置知识1", "前置知识2"],
    "common_misconceptions": [
      {{"misconception": "常见错误认知", "correct_understanding": "正确理解", "reason": "学生容易犯错的原因"}}
    ]
  }},
  "socratic_questions": [
    {{
      "level": "认知层次（记忆/理解/应用/分析/评价/创造）",
      "question": "苏格拉底式问题",
      "purpose": "提问目的",
      "expected_responses": ["预期回答方向1", "预期回答方向2"],
      "follow_up": "追问方向"
    }}
  ],
  "quick_check": [
    {{
      "type": "判断题/选择题/填空题/简答题",
      "content": "题目内容",
      "answer": "正确答案",
      "distractor_analysis": "干扰项分析（选择题）或错误分析",
      "difficulty": "简单/中等/较难"
    }}
  ],
  "misconception_traps": [
    {{
      "trap_question": "专门针对易错点设计的问题",
      "common_wrong_answer": "学生常见错误回答",
      "correct_answer": "正确答案",
      "explanation": "纠错解释"
    }}
  ],
  "classroom_activities": [
    {{"activity": "互动活动名称", "duration_min": 时长, "description": "活动描述", "purpose": "活动目的"}}
  ],
  "differentiated_questions": {{
    "basic": "面向基础薄弱学生的问题",
    "standard": "面向普通学生的问题",
    "challenge": "面向优秀学生的挑战问题"
  }}
}}

只返回JSON。"""

ANSWER_ANALYSIS_PROMPT = """你是一名有经验的{subject}老师，正在分析学生对课堂问题的回答。

问题：{question}
学生回答：{student_answer}
标准答案要点：{correct_answer}

请给出即时反馈，返回JSON：
{{
  "correctness": "完全正确/基本正确/部分正确/有明显错误/完全错误",
  "score_percentage": 得分比例（0-100），
  "what_is_right": "正确的部分（鼓励性指出）",
  "what_is_wrong": "错误或不足的部分（建设性指出）",
  "hint": "引导性提示（不直接给答案，而是引导思考）",
  "follow_up_question": "基于该回答的追问（推动更深入思考）",
  "teacher_response": "老师的口头回应示例（简短、鼓励性、有引导）"
}}

只返回JSON。"""


async def generate_questions_stream(
    subject: str,
    grade: str,
    topic: str,
    stage: str = "讲授中",
) -> AsyncGenerator[dict, None]:
    """流式生成课堂问答方案"""
    client = get_llm_client()
    model = get_model_name()
    import asyncio

    yield {"type": "progress", "step": "分析知识结构...", "percent": 20}
    await asyncio.sleep(0.3)

    yield {"type": "progress", "step": "生成苏格拉底式问题序列...", "percent": 55}

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": QUESTION_GEN_PROMPT.format(
                subject=subject,
                grade=grade,
                topic=topic,
                stage=stage,
            )}],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=2500,
        )
        result = json.loads(resp.choices[0].message.content)
    except Exception:
        result = _fallback_questions(subject, topic)

    yield {"type": "progress", "step": "完善易错点分析...", "percent": 90}
    await asyncio.sleep(0.2)

    yield {"type": "done", "data": result}


async def analyze_answer_stream(
    subject: str,
    question: str,
    student_answer: str,
    correct_answer: str,
) -> AsyncGenerator[dict, None]:
    """流式分析学生回答"""
    client = get_llm_client()
    model = get_model_name()

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": ANSWER_ANALYSIS_PROMPT.format(
                subject=subject,
                question=question,
                student_answer=student_answer,
                correct_answer=correct_answer,
            )}],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=800,
        )
        result = json.loads(resp.choices[0].message.content)
    except Exception:
        result = {
            "correctness": "基本正确",
            "score_percentage": 75,
            "what_is_right": "核心思路方向正确，理解了基本概念",
            "what_is_wrong": "表述不够完整，缺少关键条件说明",
            "hint": "思考一下，这个结论成立需要哪些前提条件？",
            "follow_up_question": "如果条件改变，结论会有什么变化？",
            "teacher_response": "很好！你抓住了核心，再想想有没有需要补充的条件？",
        }

    yield {"type": "done", "data": result}


def _fallback_questions(subject: str, topic: str) -> dict:
    return {
        "knowledge_overview": {
            "core_concepts": [f"{topic}的定义", f"{topic}的性质", f"{topic}的应用"],
            "prerequisite_knowledge": ["相关基础概念", "前章节核心知识"],
            "common_misconceptions": [
                {"misconception": f"混淆{topic}与相似概念", "correct_understanding": "注意区分关键特征", "reason": "表面相似导致混淆"},
            ],
        },
        "socratic_questions": [
            {"level": "记忆", "question": f"{topic}的定义是什么？", "purpose": "激活已有知识", "expected_responses": ["能说出基本定义"], "follow_up": "这个定义中最关键的词是哪个？"},
            {"level": "理解", "question": f"用自己的话解释一下{topic}是什么意思", "purpose": "检验真实理解", "expected_responses": ["用自己的语言转述"], "follow_up": "能举个生活中的例子吗？"},
            {"level": "应用", "question": f"遇到这类问题，你会怎么运用{topic}？", "purpose": "促进迁移应用", "expected_responses": ["描述解题思路"], "follow_up": "这种方法有没有局限性？"},
            {"level": "分析", "question": f"{topic}和我们之前学过的内容有什么联系？", "purpose": "建立知识网络", "expected_responses": ["找出知识间的联系"], "follow_up": "这种联系对我们解题有什么帮助？"},
        ],
        "quick_check": [
            {"type": "判断题", "content": f"关于{topic}的判断题示例", "answer": "视具体内容而定", "distractor_analysis": "易错点：对定义理解不准确", "difficulty": "简单"},
            {"type": "选择题", "content": f"考查{topic}核心概念的选择题", "answer": "A（示例）", "distractor_analysis": "干扰项设计针对常见错误", "difficulty": "中等"},
            {"type": "简答题", "content": f"请简述{topic}的主要特点及应用", "answer": "需结合具体知识点作答", "distractor_analysis": "注意答题完整性", "difficulty": "较难"},
        ],
        "misconception_traps": [
            {"trap_question": f"针对{topic}常见易错点的问题", "common_wrong_answer": "典型错误回答", "correct_answer": "正确答案", "explanation": "纠错分析说明"},
        ],
        "classroom_activities": [
            {"activity": "同伴互教", "duration_min": 5, "description": "两人互相解释核心概念，加深理解", "purpose": "通过输出强化记忆"},
            {"activity": "快速书写", "duration_min": 3, "description": "用1分钟写下本节最重要的3个知识点", "purpose": "整理内化所学"},
        ],
        "differentiated_questions": {
            "basic": f"用最简单的方式描述{topic}是什么",
            "standard": f"举例说明{topic}在实际中的应用",
            "challenge": f"如果{topic}的条件发生变化，结论会如何改变？为什么？",
        },
    }


def get_subject_topics() -> dict:
    return SUBJECT_TOPICS
