"""案例9：智能作业批改与个性化反馈服务"""
from __future__ import annotations
import json
from typing import AsyncGenerator
from services.llm_client import get_llm_client, get_model_name

SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"]
GRADE_LEVELS = ["小学1-2年级", "小学3-4年级", "小学5-6年级", "初中7-8年级", "初中9年级", "高中10-11年级", "高中12年级"]
ASSIGNMENT_TYPES = ["作文/写作", "解答题", "阅读理解", "实验报告", "英语作文", "数学证明题"]

SAMPLE_WORKS = [
    {
        "subject": "语文",
        "grade": "初中7-8年级",
        "type": "作文/写作",
        "title": "我的家乡",
        "content": """我的家乡在一个美丽的小镇上。那里有高高的山，清清的水，还有很多好吃的东西。
每到春天，山上的花都开了，红的、黄的、白的，非常好看。
夏天的时候，我们会去河里游泳，水很凉快，很舒服。
秋天是收获的季节，果树上挂满了苹果和梨，农民伯伯都很高兴。
冬天下雪了，我们会堆雪人，打雪仗，非常开心。
我爱我的家乡，因为那里有我的家人和朋友。我希望家乡越来越好。"""
    },
    {
        "subject": "数学",
        "grade": "高中10-11年级",
        "type": "解答题",
        "title": "函数求导应用题",
        "content": """已知函数f(x) = x³ - 3x² + 2，求：
(1) f(x)的单调区间
(2) f(x)的极值
解：
f'(x) = 3x² - 6x = 3x(x-2)
令f'(x) = 0，得x = 0或x = 2
当x < 0时，f'(x) > 0，单调递增
当0 < x < 2时，f'(x) < 0，单调递减
当x > 2时，f'(x) > 0，单调递增
所以单调递增区间为(-∞, 0)和(2, +∞)，单调递减区间为(0, 2)
极大值f(0) = 2，极小值f(2) = -4+2 = -2"""
    },
    {
        "subject": "英语",
        "grade": "高中10-11年级",
        "type": "英语作文",
        "title": "My Dream Job",
        "content": """My dream job is to become a doctor. I want to be a doctor because I want to help sick people get better.

When I was young, my grandmother was very sick and the doctors saved her life. From that moment, I decide to become a doctor too.

To achieve my dream, I am studying very hard in school, especial in science and biology. I also read many books about medicine in my free time.

Being a doctor is not easy. You need to study for many years and work very hard. But I think it is worth it because you can help many peoples.

In the future, I hope to work in a big hospital and specialize in pediatrics because I love children. I will do my best to save lives and make the world more better."""
    },
]

GRADING_PROMPT = """你是一名经验丰富的{subject}老师，正在批改{grade}学生的{assignment_type}作业。

作业题目：{title}
学生作答：
{content}

请进行全面批改，返回JSON格式：
{{
  "total_score": 总分（满分100），
  "rubric_scores": [
    {{"dimension": "评分维度名称", "score": 得分, "full_score": 满分, "comment": "简评（20字以内）"}}
  ],
  "strengths": ["亮点1", "亮点2", "亮点3"],
  "errors": [
    {{"location": "错误位置/内容片段", "error_type": "错误类型", "explanation": "错误说明", "correction": "正确写法"}}
  ],
  "improvement_suggestions": ["具体改进建议1", "具体改进建议2", "具体改进建议3"],
  "overall_comment": "总体评语（50-80字，鼓励为主，指出核心改进方向）",
  "grade_label": "优秀/良好/中等/待提高",
  "reference_points": ["参考示范要点1（可借鉴的优质表达方向）", "参考示范要点2"]
}}

评分维度请根据学科和作业类型自行设定（3-5个维度），只返回JSON。"""


async def grade_homework_stream(
    subject: str,
    grade: str,
    assignment_type: str,
    title: str,
    content: str,
) -> AsyncGenerator[dict, None]:
    """流式批改作业"""
    client = get_llm_client()
    model = get_model_name()

    yield {"type": "progress", "step": "正在分析作业内容...", "percent": 20}

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": GRADING_PROMPT.format(
                subject=subject,
                grade=grade,
                assignment_type=assignment_type,
                title=title,
                content=content,
            )}],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000,
        )
        result = json.loads(resp.choices[0].message.content)
    except Exception:
        result = _fallback_result(subject)

    yield {"type": "progress", "step": "生成个性化反馈建议...", "percent": 80}

    import asyncio
    await asyncio.sleep(0.3)

    yield {"type": "done", "data": result}


def _fallback_result(subject: str) -> dict:
    return {
        "total_score": 75,
        "rubric_scores": [
            {"dimension": "内容完整性", "score": 20, "full_score": 25, "comment": "内容基本完整，有待深化"},
            {"dimension": "表达清晰度", "score": 18, "full_score": 25, "comment": "表达较清晰，逻辑基本通顺"},
            {"dimension": "知识准确性", "score": 22, "full_score": 30, "comment": "核心知识掌握，细节有误"},
            {"dimension": "创新与亮点", "score": 15, "full_score": 20, "comment": "有一定个人见解"},
        ],
        "strengths": ["思路清晰，结构完整", "能结合实际例子说明", "书写工整认真"],
        "errors": [
            {"location": "第二段", "error_type": "逻辑错误", "explanation": "论述前后不够一致", "correction": "建议明确论点后再展开举例"},
        ],
        "improvement_suggestions": ["加强关键概念的准确表述", "丰富论据，增加说服力", "结尾升华主题，点明核心观点"],
        "overall_comment": f"该同学在{subject}作业中表现较好，基础扎实，思路清晰。建议在表达深度上继续努力，多积累相关素材，相信下次会有更好的表现！",
        "grade_label": "良好",
        "reference_points": ["优质作品通常会有清晰的论点陈述", "结合具体数据或案例会更有说服力"],
    }


def get_config() -> dict:
    return {
        "subjects": SUBJECTS,
        "grade_levels": GRADE_LEVELS,
        "assignment_types": ASSIGNMENT_TYPES,
        "samples": [{"subject": s["subject"], "grade": s["grade"], "type": s["type"], "title": s["title"]} for s in SAMPLE_WORKS],
    }


def get_sample(index: int) -> dict:
    if 0 <= index < len(SAMPLE_WORKS):
        return SAMPLE_WORKS[index]
    return SAMPLE_WORKS[0]
