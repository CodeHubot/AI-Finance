"""案例11：智能教学设计助手服务"""
from __future__ import annotations
import json
from typing import AsyncGenerator
from services.llm_client import get_llm_client, get_model_name

SAMPLE_TOPICS = [
    {"subject": "数学", "grade": "高中一年级", "topic": "函数的单调性", "duration": 45},
    {"subject": "语文", "grade": "初中八年级", "topic": "《背影》精读赏析", "duration": 45},
    {"subject": "英语", "grade": "初中七年级", "topic": "现在进行时的用法", "duration": 45},
    {"subject": "物理", "grade": "高中二年级", "topic": "楞次定律", "duration": 90},
    {"subject": "历史", "grade": "初中九年级", "topic": "五四运动", "duration": 45},
]

DESIGN_PROMPT = """你是一名优秀的{subject}教师，正在为{grade}学生设计一堂{duration}分钟的课程。

课题：{topic}
教学目标：{objectives}
班级情况：{class_description}

请设计完整的教学方案，返回JSON：
{{
  "lesson_overview": {{
    "subject": "{subject}",
    "grade": "{grade}",
    "topic": "{topic}",
    "duration": {duration},
    "objectives": {{
      "knowledge": "知识目标（学生能掌握什么知识）",
      "skill": "能力目标（学生能做到什么）",
      "emotion": "情感目标（培养什么品质或情感）"
    }},
    "key_points": ["教学重点1", "教学重点2"],
    "difficulties": ["教学难点1", "教学难点2"],
    "teaching_methods": ["教学方法1", "教学方法2", "教学方法3"]
  }},
  "teaching_flow": [
    {{
      "stage": "教学环节名称",
      "duration_min": 时间（分钟）,
      "teacher_activity": "教师活动描述",
      "student_activity": "学生活动描述",
      "design_intent": "设计意图（为什么这样设计）",
      "materials": ["所需材料/资源"]
    }}
  ],
  "discussion_questions": [
    {{"question": "课堂讨论问题", "type": "导入/探究/拓展", "expected_answer_hints": "参考答案要点"}}
  ],
  "exercises": [
    {{
      "type": "基础/提高/拓展",
      "content": "题目内容",
      "answer": "参考答案",
      "thinking_process": "解题思路提示"
    }}
  ],
  "homework": {{
    "basic": "基础作业（面向全体）",
    "advanced": "提高作业（面向学有余力学生）",
    "purpose": "作业设计目的"
  }},
  "differentiation": {{
    "for_struggling": "针对学困生的调整策略",
    "for_advanced": "针对优等生的拓展方向"
  }},
  "board_design": "板书设计要点（文字描述结构）",
  "reflection_prompts": ["课后反思问题1", "课后反思问题2"]
}}

只返回JSON，教学环节请包含：导入新课、讲授新知、练习巩固、小结提升（可根据课型调整）。"""


async def design_lesson_stream(
    subject: str,
    grade: str,
    topic: str,
    duration: int,
    objectives: str,
    class_description: str = "",
) -> AsyncGenerator[dict, None]:
    """流式生成教学设计"""
    client = get_llm_client()
    model = get_model_name()

    import asyncio

    yield {"type": "progress", "step": "分析课程目标...", "percent": 15}
    await asyncio.sleep(0.3)

    yield {"type": "progress", "step": "设计教学流程...", "percent": 45}

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": DESIGN_PROMPT.format(
                subject=subject,
                grade=grade,
                topic=topic,
                duration=duration,
                objectives=objectives or f"掌握{topic}的核心概念，能运用所学解决实际问题",
                class_description=class_description or "普通班级，学生基础参差不齐，整体中等水平",
            )}],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=3000,
        )
        result = json.loads(resp.choices[0].message.content)
    except Exception:
        result = _fallback_design(subject, grade, topic, duration)

    yield {"type": "progress", "step": "完善习题与作业设计...", "percent": 90}
    await asyncio.sleep(0.2)

    yield {"type": "done", "data": result}


def _fallback_design(subject: str, grade: str, topic: str, duration: int) -> dict:
    intro = min(8, duration // 6)
    main = duration - intro - 10 - 5
    return {
        "lesson_overview": {
            "subject": subject, "grade": grade, "topic": topic, "duration": duration,
            "objectives": {
                "knowledge": f"理解{topic}的核心概念和基本原理",
                "skill": f"能运用{topic}解决相关问题",
                "emotion": "培养严谨的思维习惯和探究精神",
            },
            "key_points": [f"{topic}的定义与性质", f"{topic}的应用方法"],
            "difficulties": [f"{topic}的本质理解", "灵活运用解决综合问题"],
            "teaching_methods": ["讲授法", "问题探究法", "合作学习法"],
        },
        "teaching_flow": [
            {"stage": "创设情境·导入新课", "duration_min": intro, "teacher_activity": "设置问题情境，激发学生兴趣", "student_activity": "思考问题，激活已有知识", "design_intent": "引发认知冲突，激发学习动机", "materials": ["PPT"]},
            {"stage": "探究新知·讲授核心", "duration_min": main, "teacher_activity": "引导学生探究，讲解核心概念", "student_activity": "主动探究，记录要点", "design_intent": "建构知识体系，突破重难点", "materials": ["教材", "PPT", "学案"]},
            {"stage": "练习巩固·深化理解", "duration_min": 10, "teacher_activity": "布置练习，巡视辅导", "student_activity": "独立完成练习，小组讨论", "design_intent": "检验学习效果，及时反馈", "materials": ["练习题"]},
            {"stage": "归纳小结·布置作业", "duration_min": 5, "teacher_activity": "引导学生归纳，布置作业", "student_activity": "总结本节重点，记录作业", "design_intent": "系统梳理，巩固提升", "materials": ["板书"]},
        ],
        "discussion_questions": [
            {"question": f"你在生活中见过{topic}的哪些例子？", "type": "导入", "expected_answer_hints": "联系生活实际，言之有理即可"},
            {"question": f"{topic}的核心特征是什么？能否用自己的话描述？", "type": "探究", "expected_answer_hints": "抓住关键属性，准确表达"},
        ],
        "exercises": [
            {"type": "基础", "content": f"关于{topic}的基础判断题或填空题", "answer": "根据具体内容确定", "thinking_process": "回顾定义，逐步分析"},
            {"type": "提高", "content": f"综合运用{topic}的解答题", "answer": "详见答案", "thinking_process": "审题→建立模型→求解→验证"},
        ],
        "homework": {
            "basic": f"课本{topic}对应练习题第1-5题",
            "advanced": f"拓展题：{topic}的综合应用问题",
            "purpose": "巩固课堂所学，培养独立解题能力",
        },
        "differentiation": {
            "for_struggling": "降低题目难度，加强基础概念练习，提供学习支架",
            "for_advanced": "提供开放性问题，鼓励探究更深层的联系",
        },
        "board_design": f"主标题：{topic}\n一、定义\n二、性质\n三、方法归纳",
        "reflection_prompts": ["本节课重难点是否突破？如何改进？", "学生参与度如何？哪个环节最有效？"],
    }


def get_sample_topics() -> list:
    return SAMPLE_TOPICS
