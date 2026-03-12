"""案例10：个性化学习路径规划服务"""
from __future__ import annotations
import json
from typing import AsyncGenerator
from services.llm_client import get_llm_client, get_model_name

SUBJECTS_CONFIG = {
    "高中数学": {
        "topics": ["函数与导数", "三角函数", "数列", "向量", "圆锥曲线", "概率统计", "立体几何", "排列组合"],
        "levels": ["基础薄弱", "基础一般", "基础扎实", "重点提升", "冲击满分"],
    },
    "初中英语": {
        "topics": ["词汇积累", "语法基础", "阅读理解", "写作表达", "听力口语", "完形填空"],
        "levels": ["入门级", "初级", "中级", "中高级", "高级"],
    },
    "高中物理": {
        "topics": ["力学基础", "运动学", "牛顿定律", "能量动量", "电场磁场", "电磁感应", "光学波动", "近代物理"],
        "levels": ["基础薄弱", "基础一般", "基础扎实", "重点提升", "冲击满分"],
    },
    "初中语文": {
        "topics": ["现代文阅读", "古诗文鉴赏", "文言文翻译", "作文写作", "名著阅读", "基础字词"],
        "levels": ["基础薄弱", "基础一般", "基础扎实", "提升阶段"],
    },
    "大学英语": {
        "topics": ["四级备考", "六级备考", "学术写作", "口语表达", "专业阅读", "翻译技巧"],
        "levels": ["基础薄弱", "四级水平", "六级水平", "学术英语"],
    },
}

PATH_PROMPT = """你是一名资深教育专家，为学生制定个性化学习路径。

学生信息：
- 学科：{subject}
- 当前水平：{current_level}
- 薄弱模块：{weak_topics}（学生自评）
- 学习目标：{goal}
- 每周可用学习时间：{hours_per_week}小时
- 备考/提升周期：{weeks}周

请制定科学的学习路径，返回JSON：
{{
  "diagnosis": {{
    "current_assessment": "当前水平诊断（2-3句）",
    "key_gaps": ["核心知识短板1", "核心知识短板2", "核心知识短板3"],
    "priority_direction": "最优先突破方向"
  }},
  "phases": [
    {{
      "phase_num": 阶段编号,
      "phase_name": "阶段名称",
      "duration_weeks": 持续周数,
      "focus_topics": ["本阶段重点模块1", "本阶段重点模块2"],
      "weekly_plan": {{
        "days_per_week": 建议学习天数,
        "hours_per_day": 每天学时,
        "activities": ["每日活动1（时长）", "每日活动2（时长）"]
      }},
      "milestone": "阶段目标（可量化）",
      "resources": ["推荐资源类型1", "推荐资源类型2"]
    }}
  ],
  "knowledge_map": [
    {{"node": "知识点", "prerequisite": "前置知识点（无则填null）", "importance": "high/medium/low"}}
  ],
  "tips": ["学习方法建议1", "学习方法建议2", "学习方法建议3"],
  "weekly_schedule_template": {{
    "mon_wed_fri": "建议安排",
    "tue_thu": "建议安排",
    "weekend": "建议安排"
  }}
}}

只返回JSON。"""


async def generate_path_stream(
    subject: str,
    current_level: str,
    weak_topics: list,
    goal: str,
    hours_per_week: int,
    weeks: int,
) -> AsyncGenerator[dict, None]:
    """流式生成个性化学习路径"""
    client = get_llm_client()
    model = get_model_name()

    yield {"type": "progress", "step": "分析学情数据...", "percent": 15}

    import asyncio
    await asyncio.sleep(0.3)

    yield {"type": "progress", "step": "构建知识图谱...", "percent": 40}

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": PATH_PROMPT.format(
                subject=subject,
                current_level=current_level,
                weak_topics="、".join(weak_topics) if weak_topics else "尚未明确",
                goal=goal,
                hours_per_week=hours_per_week,
                weeks=weeks,
            )}],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=2500,
        )
        result = json.loads(resp.choices[0].message.content)
    except Exception:
        result = _fallback_path(subject, weeks)

    yield {"type": "progress", "step": "生成个性化方案...", "percent": 90}
    await asyncio.sleep(0.2)

    yield {"type": "done", "data": result}


def _fallback_path(subject: str, weeks: int) -> dict:
    phase_weeks = max(1, weeks // 3)
    return {
        "diagnosis": {
            "current_assessment": f"学生在{subject}学科基础有一定积累，但部分核心模块理解尚不深入，需要系统性强化。",
            "key_gaps": ["基础概念理解不够牢固", "解题方法不够熟练", "综合应用能力有待提升"],
            "priority_direction": "先夯实基础，再提升解题技巧",
        },
        "phases": [
            {
                "phase_num": 1,
                "phase_name": "基础夯实阶段",
                "duration_weeks": phase_weeks,
                "focus_topics": ["核心概念梳理", "基础题型练习"],
                "weekly_plan": {
                    "days_per_week": 5,
                    "hours_per_day": 1.5,
                    "activities": ["概念复习（30分钟）", "例题精讲（30分钟）", "基础练习（30分钟）"],
                },
                "milestone": f"{phase_weeks}周后能独立完成基础题型，正确率达85%",
                "resources": ["教材例题", "配套练习册", "在线视频课程"],
            },
            {
                "phase_num": 2,
                "phase_name": "能力提升阶段",
                "duration_weeks": phase_weeks,
                "focus_topics": ["综合题型训练", "解题方法总结"],
                "weekly_plan": {
                    "days_per_week": 5,
                    "hours_per_day": 2,
                    "activities": ["专题训练（60分钟）", "错题分析（30分钟）", "方法总结（30分钟）"],
                },
                "milestone": "能独立解决中等难度综合题",
                "resources": ["专题练习册", "真题汇编", "错题本"],
            },
            {
                "phase_num": 3,
                "phase_name": "冲刺提高阶段",
                "duration_weeks": weeks - phase_weeks * 2,
                "focus_topics": ["模拟测试", "查漏补缺"],
                "weekly_plan": {
                    "days_per_week": 6,
                    "hours_per_day": 2,
                    "activities": ["模拟测试（60分钟）", "讲评分析（30分钟）", "专项突破（30分钟）"],
                },
                "milestone": "模拟成绩稳定在目标分数段",
                "resources": ["历年真题", "模拟卷", "冲刺讲义"],
            },
        ],
        "knowledge_map": [
            {"node": "基础概念", "prerequisite": None, "importance": "high"},
            {"node": "核心方法", "prerequisite": "基础概念", "importance": "high"},
            {"node": "综合应用", "prerequisite": "核心方法", "importance": "medium"},
        ],
        "tips": [
            "每天固定时间学习，培养学习节律",
            "做题后必须总结错误原因，不只是改正答案",
            "定期回顾之前学过的内容，防止遗忘",
        ],
        "weekly_schedule_template": {
            "mon_wed_fri": "新知识学习+例题练习（90分钟）",
            "tue_thu": "专题训练+错题复盘（90分钟）",
            "weekend": "综合测试+知识体系梳理（2小时）",
        },
    }


def get_subjects() -> dict:
    return SUBJECTS_CONFIG
