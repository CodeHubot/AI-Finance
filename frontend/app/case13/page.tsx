"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, MessageSquare, Loader2, ChevronRight,
  AlertTriangle, CheckCircle, Brain, Zap, BarChart3,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

interface QAResult {
  knowledge_overview: {
    core_concepts: string[];
    prerequisite_knowledge: string[];
    common_misconceptions: { misconception: string; correct_understanding: string; reason: string }[];
  };
  socratic_questions: {
    level: string;
    question: string;
    purpose: string;
    expected_responses: string[];
    follow_up: string;
  }[];
  quick_check: {
    type: string;
    content: string;
    answer: string;
    distractor_analysis: string;
    difficulty: string;
  }[];
  misconception_traps: {
    trap_question: string;
    common_wrong_answer: string;
    correct_answer: string;
    explanation: string;
  }[];
  classroom_activities: {
    activity: string;
    duration_min: number;
    description: string;
    purpose: string;
  }[];
  differentiated_questions: { basic: string; standard: string; challenge: string };
}

interface AnswerAnalysis {
  correctness: string;
  score_percentage: number;
  what_is_right: string;
  what_is_wrong: string;
  hint: string;
  follow_up_question: string;
  teacher_response: string;
}

const CORRECTNESS_COLOR: Record<string, string> = {
  "完全正确": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "基本正确": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "部分正确": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "有明显错误": "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "完全错误": "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  "简单": "text-emerald-400 bg-emerald-400/10",
  "中等": "text-amber-400 bg-amber-400/10",
  "较难": "text-rose-400 bg-rose-400/10",
};

const LEVEL_COLOR: Record<string, string> = {
  "记忆": "bg-gray-700 text-gray-300",
  "理解": "bg-blue-500/20 text-blue-300",
  "应用": "bg-emerald-500/20 text-emerald-300",
  "分析": "bg-purple-500/20 text-purple-300",
  "评价": "bg-orange-500/20 text-orange-300",
  "创造": "bg-rose-500/20 text-rose-300",
};

export default function Case13Page() {
  const [subjectTopics, setSubjectTopics] = useState<Record<string, string[]>>({});
  const [subject, setSubject] = useState("数学");
  const [grade, setGrade] = useState("初中八年级");
  const [topic, setTopic] = useState("勾股定理");
  const [stage, setStage] = useState("讲授中");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [result, setResult] = useState<QAResult | null>(null);
  const [activeTab, setActiveTab] = useState("socratic");

  // Answer analysis
  const [analyzeMode, setAnalyzeMode] = useState(false);
  const [selQuestion, setSelQuestion] = useState("");
  const [selAnswer, setSelAnswer] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerAnalysis | null>(null);

  useEffect(() => {
    fetch(api.case13.topics())
      .then((r) => r.json())
      .then((data) => {
        setSubjectTopics(data);
        const first = Object.keys(data)[0];
        if (first) { setSubject(first); setTopic(data[first][0] || ""); }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setProgress({ step: "分析知识点...", percent: 10 });
    try {
      await streamFetch(
        api.case13.generate(),
        { subject, grade, topic, stage },
        (data) => {
          if (data.type === "progress") setProgress({ step: data.step, percent: data.percent });
          else if (data.type === "done") { setResult(data.data); setProgress(null); setActiveTab("socratic"); }
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAnswer = async () => {
    if (!selQuestion || !studentInput.trim()) return;
    setAnalyzing(true);
    setAnswerResult(null);
    try {
      await streamFetch(
        api.case13.analyzeAnswer(),
        { subject, question: selQuestion, student_answer: studentInput, correct_answer: selAnswer },
        (data) => {
          if (data.type === "done") setAnswerResult(data.data);
        }
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const startAnalyze = (q: string, a: string) => {
    setSelQuestion(q);
    setSelAnswer(a);
    setStudentInput("");
    setAnswerResult(null);
    setAnalyzeMode(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">案例 13：智慧课堂问答系统</h1>
              <p className="text-xs text-gray-400">苏格拉底式提问 + 即时课堂反馈</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">苏格拉底提问</span>
            <span className="px-2 py-1 rounded bg-gray-800">错误诊断</span>
            <span className="px-2 py-1 rounded bg-gray-800">即时反馈</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" /> 课堂配置
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">学科</label>
                <select value={subject} onChange={(e) => { setSubject(e.target.value); setTopic(subjectTopics[e.target.value]?.[0] || ""); }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
                  {Object.keys(subjectTopics).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">年级</label>
                <input value={grade} onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">知识点</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="输入具体知识点"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(subjectTopics[subject] || []).map((t) => (
                  <button key={t} onClick={() => setTopic(t)}
                    className={`px-2 py-0.5 rounded text-xs border transition-all ${topic === t ? "bg-cyan-600/20 border-cyan-500 text-cyan-300" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">课堂阶段</label>
              <div className="grid grid-cols-2 gap-2">
                {["新课导入", "讲授中", "课堂检测", "总结复习"].map((s) => (
                  <button key={s} onClick={() => setStage(s)}
                    className={`py-1.5 rounded-lg text-xs border transition-all ${stage === s ? "bg-cyan-600/20 border-cyan-500 text-cyan-300" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleGenerate} disabled={loading || !topic.trim()}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "生成中..." : "生成课堂问答方案"}
            </button>
          </div>

          {progress && (
            <div className="bg-cyan-900/20 border border-cyan-800/50 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-cyan-300">{progress.step}</span>
                <span className="text-xs text-cyan-400">{progress.percent}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          )}

          {/* Answer Analyzer Modal-like */}
          {analyzeMode && (
            <div className="bg-gray-900 rounded-xl border border-cyan-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-cyan-400">即时回答分析</h3>
                <button onClick={() => setAnalyzeMode(false)} className="text-xs text-gray-500 hover:text-gray-300">关闭</button>
              </div>
              <div className="bg-gray-800 rounded-lg p-2">
                <p className="text-xs text-gray-400">问题：</p>
                <p className="text-xs text-gray-200">{selQuestion}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">学生回答</label>
                <textarea value={studentInput} onChange={(e) => setStudentInput(e.target.value)} rows={3}
                  placeholder="输入学生的回答..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 resize-none" />
              </div>
              <button onClick={handleAnalyzeAnswer} disabled={analyzing || !studentInput.trim()}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-medium flex items-center justify-center gap-2">
                {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                AI 即时评析
              </button>
              {answerResult && (
                <div className="bg-gray-800/60 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${CORRECTNESS_COLOR[answerResult.correctness] || ""}`}>{answerResult.correctness}</span>
                    <span className="text-xs text-gray-400">{answerResult.score_percentage}分</span>
                  </div>
                  {answerResult.what_is_right && <p className="text-xs text-emerald-400">✓ {answerResult.what_is_right}</p>}
                  {answerResult.what_is_wrong && <p className="text-xs text-amber-400">△ {answerResult.what_is_wrong}</p>}
                  <p className="text-xs text-cyan-300">💡 {answerResult.hint}</p>
                  <div className="bg-gray-900 rounded p-2">
                    <p className="text-xs text-gray-400 mb-0.5">教师示范回应：</p>
                    <p className="text-xs text-white italic">"{answerResult.teacher_response}"</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !loading && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center h-full flex flex-col items-center justify-center gap-3">
              <MessageSquare className="w-12 h-12 text-gray-700" />
              <p className="text-gray-500 text-sm">选择学科与知识点，生成智慧课堂问答方案</p>
            </div>
          )}

          {result && (
            <>
              {/* Knowledge overview */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> 知识点全景
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">核心概念</p>
                    {result.knowledge_overview.core_concepts.map((c, i) => (
                      <p key={i} className="text-xs text-gray-300 mb-1 flex items-center gap-1"><ChevronRight className="w-3 h-3 text-cyan-400" />{c}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">前置知识</p>
                    {result.knowledge_overview.prerequisite_knowledge.map((p, i) => (
                      <p key={i} className="text-xs text-gray-300 mb-1 flex items-center gap-1"><ChevronRight className="w-3 h-3 text-gray-500" />{p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">常见误区</p>
                    {result.knowledge_overview.common_misconceptions.map((m, i) => (
                      <p key={i} className="text-xs text-amber-400 mb-1 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{m.misconception}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="flex border-b border-gray-800">
                  {[
                    { key: "socratic", label: "苏格拉底问题" },
                    { key: "check", label: "快速检测" },
                    { key: "traps", label: "易错陷阱" },
                    { key: "activities", label: "互动活动" },
                  ].map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-2.5 text-xs font-medium transition-all ${activeTab === tab.key ? "bg-gray-800 text-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {activeTab === "socratic" && (
                    <div className="space-y-3">
                      {result.socratic_questions.map((q, i) => (
                        <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${LEVEL_COLOR[q.level] || "bg-gray-700 text-gray-300"}`}>{q.level}</span>
                            <span className="text-xs text-gray-500">{q.purpose}</span>
                          </div>
                          <p className="text-sm text-white mb-2 font-medium">Q{i + 1}: {q.question}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-gray-500 mb-1">预期回答方向</p>
                              {q.expected_responses.map((r, j) => (
                                <p key={j} className="text-gray-300">· {r}</p>
                              ))}
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">追问方向</p>
                              <p className="text-cyan-300">{q.follow_up}</p>
                            </div>
                          </div>
                          <button onClick={() => startAnalyze(q.question, q.expected_responses.join("；"))}
                            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline">
                            模拟学生回答 →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "check" && (
                    <div className="space-y-3">
                      {result.quick_check.map((qc, i) => (
                        <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">{qc.type}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLOR[qc.difficulty] || ""}`}>{qc.difficulty}</span>
                          </div>
                          <p className="text-sm text-white mb-2">{qc.content}</p>
                          <div className="bg-gray-900 rounded p-2 text-xs">
                            <span className="text-gray-400">答案：</span><span className="text-emerald-400">{qc.answer}</span>
                          </div>
                          <p className="text-xs text-amber-400/70 mt-1.5">⚠ {qc.distractor_analysis}</p>
                          <button onClick={() => startAnalyze(qc.content, qc.answer)}
                            className="mt-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline">
                            分析学生回答 →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "traps" && (
                    <div className="space-y-3">
                      {result.misconception_traps.map((trap, i) => (
                        <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                          <p className="text-sm text-white mb-2 font-medium">{trap.trap_question}</p>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="bg-rose-900/20 rounded p-2">
                              <p className="text-xs text-rose-400 mb-0.5">常见错误答案</p>
                              <p className="text-xs text-gray-300">{trap.common_wrong_answer}</p>
                            </div>
                            <div className="bg-emerald-900/20 rounded p-2">
                              <p className="text-xs text-emerald-400 mb-0.5">正确答案</p>
                              <p className="text-xs text-gray-300">{trap.correct_answer}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">📖 {trap.explanation}</p>
                        </div>
                      ))}

                      {/* Differentiated questions */}
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-2">差异化提问</p>
                        <div className="space-y-2">
                          {[
                            { label: "基础", q: result.differentiated_questions.basic, color: "text-blue-400" },
                            { label: "标准", q: result.differentiated_questions.standard, color: "text-emerald-400" },
                            { label: "挑战", q: result.differentiated_questions.challenge, color: "text-amber-400" },
                          ].map((item, i) => (
                            <div key={i} className="flex gap-2">
                              <span className={`text-xs font-medium ${item.color} w-8 shrink-0`}>{item.label}</span>
                              <p className="text-xs text-gray-300">{item.q}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "activities" && (
                    <div className="space-y-3">
                      {result.classroom_activities.map((act, i) => (
                        <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-white">{act.activity}</span>
                            <span className="text-xs text-cyan-400">{act.duration_min}分钟</span>
                          </div>
                          <p className="text-xs text-gray-300 mb-1">{act.description}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-cyan-400" />目的：{act.purpose}
                          </p>
                        </div>
                      ))}
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
