"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, PenTool, Loader2, Clock, Users, BookOpen,
  ChevronRight, Lightbulb, FileText, Star,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

interface SampleTopic {
  subject: string;
  grade: string;
  topic: string;
  duration: number;
}

interface TeachingFlow {
  stage: string;
  duration_min: number;
  teacher_activity: string;
  student_activity: string;
  design_intent: string;
  materials: string[];
}

interface Exercise {
  type: string;
  content: string;
  answer: string;
  thinking_process: string;
}

interface LessonResult {
  lesson_overview: {
    subject: string; grade: string; topic: string; duration: number;
    objectives: { knowledge: string; skill: string; emotion: string };
    key_points: string[]; difficulties: string[]; teaching_methods: string[];
  };
  teaching_flow: TeachingFlow[];
  discussion_questions: { question: string; type: string; expected_answer_hints: string }[];
  exercises: Exercise[];
  homework: { basic: string; advanced: string; purpose: string };
  differentiation: { for_struggling: string; for_advanced: string };
  board_design: string;
  reflection_prompts: string[];
}

const STAGE_COLORS: Record<string, string> = {
  "导入": "from-amber-600 to-orange-600",
  "新知": "from-blue-600 to-indigo-600",
  "探究": "from-purple-600 to-violet-600",
  "练习": "from-emerald-600 to-teal-600",
  "小结": "from-gray-600 to-gray-700",
  "总结": "from-gray-600 to-gray-700",
};

const getStageColor = (stage: string) => {
  for (const [key, color] of Object.entries(STAGE_COLORS)) {
    if (stage.includes(key)) return color;
  }
  return "from-blue-600 to-indigo-600";
};

export default function Case11Page() {
  const [samples, setSamples] = useState<SampleTopic[]>([]);
  const [subject, setSubject] = useState("数学");
  const [grade, setGrade] = useState("高中一年级");
  const [topic, setTopic] = useState("函数的单调性");
  const [duration, setDuration] = useState(45);
  const [objectives, setObjectives] = useState("");
  const [classDesc, setClassDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [activeTab, setActiveTab] = useState("flow");

  useEffect(() => {
    fetch(api.case11.samples())
      .then((r) => r.json())
      .then(setSamples)
      .catch(() => {});
  }, []);

  const loadSample = (s: SampleTopic) => {
    setSubject(s.subject);
    setGrade(s.grade);
    setTopic(s.topic);
    setDuration(s.duration);
    setResult(null);
  };

  const handleDesign = async () => {
    setLoading(true);
    setResult(null);
    setProgress({ step: "初始化...", percent: 5 });
    try {
      await streamFetch(
        api.case11.design(),
        { subject, grade, topic, duration, objectives, class_description: classDesc },
        (data) => {
          if (data.type === "progress") setProgress({ step: data.step, percent: data.percent });
          else if (data.type === "done") { setResult(data.data); setProgress(null); setActiveTab("flow"); }
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">案例 11：智能教学设计助手</h1>
              <p className="text-xs text-gray-400">一键生成完整教案，解放教师创造力</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">提示词工程</span>
            <span className="px-2 py-1 rounded bg-gray-800">教学设计</span>
            <span className="px-2 py-1 rounded bg-gray-800">差异化教学</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> 课程信息
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">学科</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">年级</label>
                <input value={grade} onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">课题名称</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="例：函数的单调性"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">课时（分钟）</label>
              <div className="flex gap-2">
                {[45, 90].map((d) => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${duration === d ? "bg-amber-600/20 border-amber-500 text-amber-300" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                    {d}分钟
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">教学目标（可选）</label>
              <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2}
                placeholder="例：掌握函数单调性的定义，能判断并证明函数单调性"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">班级情况（可选）</label>
              <input value={classDesc} onChange={(e) => setClassDesc(e.target.value)} placeholder="例：重点班，整体基础扎实，有创新意识"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <button onClick={handleDesign} disabled={loading || !topic.trim()}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
              {loading ? "设计中..." : "一键生成教学设计"}
            </button>
          </div>

          {/* Sample topics */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-2">快速示例</p>
            <div className="space-y-1.5">
              {samples.map((s, i) => (
                <button key={i} onClick={() => loadSample(s)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-amber-600/10 border border-gray-700 hover:border-amber-500/50 text-xs text-gray-300 transition-all flex justify-between items-center">
                  <span>{s.subject} · {s.topic}</span>
                  <span className="text-gray-500">{s.grade}</span>
                </button>
              ))}
            </div>
          </div>

          {progress && (
            <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-amber-300">{progress.step}</span>
                <span className="text-xs text-amber-400">{progress.percent}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !loading && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center h-full flex flex-col items-center justify-center gap-3">
              <PenTool className="w-12 h-12 text-gray-700" />
              <p className="text-gray-500 text-sm">输入课程信息，AI 自动生成完整教学设计方案</p>
            </div>
          )}

          {result && (
            <>
              {/* Overview */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{result.lesson_overview.topic}</h3>
                    <p className="text-xs text-gray-400">{result.lesson_overview.grade} · {result.lesson_overview.subject} · {result.lesson_overview.duration}分钟</p>
                  </div>
                  <div className="flex gap-1">
                    {result.lesson_overview.teaching_methods.map((m, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">{m}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "知识目标", value: result.lesson_overview.objectives.knowledge, color: "text-blue-400" },
                    { label: "能力目标", value: result.lesson_overview.objectives.skill, color: "text-emerald-400" },
                    { label: "情感目标", value: result.lesson_overview.objectives.emotion, color: "text-amber-400" },
                  ].map((obj, i) => (
                    <div key={i} className="bg-gray-800/60 rounded-lg p-2">
                      <p className={`text-xs font-medium ${obj.color} mb-1`}>{obj.label}</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{obj.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">教学重点</p>
                    {result.lesson_overview.key_points.map((p, i) => (
                      <p key={i} className="text-xs text-gray-300 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">教学难点</p>
                    {result.lesson_overview.difficulties.map((d, i) => (
                      <p key={i} className="text-xs text-gray-300 flex items-center gap-1"><ChevronRight className="w-3 h-3 text-rose-400" />{d}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="flex border-b border-gray-800">
                  {[
                    { key: "flow", label: "教学流程" },
                    { key: "questions", label: "课堂讨论" },
                    { key: "exercises", label: "练习题" },
                    { key: "homework", label: "作业" },
                    { key: "diff", label: "差异化" },
                  ].map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-2.5 text-xs font-medium transition-all ${activeTab === tab.key ? "bg-gray-800 text-amber-400" : "text-gray-500 hover:text-gray-300"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {activeTab === "flow" && (
                    <div className="space-y-3">
                      {result.teaching_flow.map((stage, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getStageColor(stage.stage)} flex items-center justify-center text-xs font-bold`}>
                              {stage.duration_min}
                            </div>
                            {i < result.teaching_flow.length - 1 && <div className="w-0.5 h-full bg-gray-800 mt-1" />}
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="text-sm font-medium text-white mb-1">{stage.stage}</p>
                            <div className="grid grid-cols-2 gap-2 mb-1">
                              <div className="bg-gray-800/60 rounded p-2">
                                <p className="text-xs text-gray-500 mb-0.5">教师活动</p>
                                <p className="text-xs text-gray-300">{stage.teacher_activity}</p>
                              </div>
                              <div className="bg-gray-800/60 rounded p-2">
                                <p className="text-xs text-gray-500 mb-0.5">学生活动</p>
                                <p className="text-xs text-gray-300">{stage.student_activity}</p>
                              </div>
                            </div>
                            <p className="text-xs text-amber-400/70 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />{stage.design_intent}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "questions" && (
                    <div className="space-y-3">
                      {result.discussion_questions.map((q, i) => (
                        <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">{q.type}</span>
                            <span className="text-xs text-gray-500">问题 {i + 1}</span>
                          </div>
                          <p className="text-sm text-white mb-2">{q.question}</p>
                          <p className="text-xs text-gray-400">💡 {q.expected_answer_hints}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "exercises" && (
                    <div className="space-y-3">
                      {result.exercises.map((ex, i) => (
                        <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                          <span className={`text-xs px-2 py-0.5 rounded mb-2 inline-block ${ex.type === "基础" ? "bg-blue-500/20 text-blue-400" : ex.type === "提高" ? "bg-purple-500/20 text-purple-400" : "bg-rose-500/20 text-rose-400"}`}>
                            {ex.type}题
                          </span>
                          <p className="text-sm text-white mb-2">{ex.content}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-900 rounded p-2">
                              <p className="text-xs text-gray-500">参考答案</p>
                              <p className="text-xs text-gray-300">{ex.answer}</p>
                            </div>
                            <div className="bg-gray-900 rounded p-2">
                              <p className="text-xs text-gray-500">解题思路</p>
                              <p className="text-xs text-gray-300">{ex.thinking_process}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "homework" && (
                    <div className="space-y-3">
                      <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3">
                        <p className="text-xs text-blue-400 mb-1">基础作业（全体必做）</p>
                        <p className="text-sm text-gray-300">{result.homework.basic}</p>
                      </div>
                      <div className="bg-purple-900/20 border border-purple-800/40 rounded-lg p-3">
                        <p className="text-xs text-purple-400 mb-1">提高作业（学有余力）</p>
                        <p className="text-sm text-gray-300">{result.homework.advanced}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">设计目的</p>
                        <p className="text-sm text-gray-300">{result.homework.purpose}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">板书设计要点</p>
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{result.board_design}</pre>
                      </div>
                    </div>
                  )}

                  {activeTab === "diff" && (
                    <div className="space-y-3">
                      <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-3">
                        <p className="text-xs text-amber-400 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> 针对学困生</p>
                        <p className="text-sm text-gray-300">{result.differentiation.for_struggling}</p>
                      </div>
                      <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg p-3">
                        <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> 针对优等生</p>
                        <p className="text-sm text-gray-300">{result.differentiation.for_advanced}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-2">课后反思提示</p>
                        {result.reflection_prompts.map((rp, i) => (
                          <p key={i} className="text-xs text-gray-300 flex items-center gap-1 mb-1">
                            <BookOpen className="w-3 h-3 text-gray-500" />{rp}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
