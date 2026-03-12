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
  "\u5b8c\u5168\u6b63\u786e": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "\u57fa\u672c\u6b63\u786e": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "\u90e8\u5206\u6b63\u786e": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "\u6709\u660e\u663e\u9519\u8bef": "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "\u5b8c\u5168\u9519\u8bef": "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  "\u7b80\u5355": "text-emerald-400 bg-emerald-400/10",
  "\u4e2d\u7b49": "text-amber-400 bg-amber-400/10",
  "\u8f83\u96be": "text-rose-400 bg-rose-400/10",
};

const LEVEL_COLOR: Record<string, string> = {
  "\u8bb0\u5fc6": "bg-gray-700 text-gray-300",
  "\u7406\u89e3": "bg-blue-500/20 text-blue-300",
  "\u5e94\u7528": "bg-emerald-500/20 text-emerald-300",
  "\u5206\u6790": "bg-purple-500/20 text-purple-300",
  "\u8bc4\u4ef7": "bg-orange-500/20 text-orange-300",
  "\u521b\u9020": "bg-rose-500/20 text-rose-300",
};

export default function Case13Page() {
  const [subjectTopics, setSubjectTopics] = useState<Record<string, string[]>>({});
  const [subject, setSubject] = useState("\u6570\u5b66");
  const [grade, setGrade] = useState("\u521d\u4e2d\u516b\u5e74\u7ea7");
  const [topic, setTopic] = useState("\u52fe\u80a1\u5b9a\u7406");
  const [stage, setStage] = useState("\u8bb2\u6388\u4e2d");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [result, setResult] = useState<QAResult | null>(null);
  const [activeTab, setActiveTab] = useState("socratic");

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
    setProgress({ step: "\u5206\u6790\u77e5\u8bc6\u70b9...", percent: 10 });
    try {
      await streamFetch(
        api.case13.generate(),
        { subject, grade, topic, stage },
        (data) => {
          if (data.type === "progress") setProgress({ step: data.step as string, percent: data.percent as number });
          else if (data.type === "done") { setResult(data.data as QAResult); setProgress(null); setActiveTab("socratic"); }
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
          if (data.type === "done") setAnswerResult(data.data as AnswerAnalysis);
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
              <h1 className="text-sm font-semibold">{"\u6848\u4f8b 13\uff1a\u667a\u6167\u8bfe\u5802\u95ee\u7b54\u7cfb\u7edf"}</h1>
              <p className="text-xs text-gray-400">{"\u82cf\u683c\u62c9\u5e95\u5f0f\u63d0\u95ee + \u5373\u65f6\u8bfe\u5802\u53cd\u9988"}</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">{"\u82cf\u683c\u62c9\u5e95\u63d0\u95ee"}</span>
            <span className="px-2 py-1 rounded bg-gray-800">{"\u9519\u8bef\u8bca\u65ad"}</span>
            <span className="px-2 py-1 rounded bg-gray-800">{"\u5373\u65f6\u53cd\u9988"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" /> {"\u8bfe\u5802\u914d\u7f6e"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u5b66\u79d1"}</label>
                <select value={subject} onChange={(e) => { setSubject(e.target.value); setTopic(subjectTopics[e.target.value]?.[0] || ""); }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
                  {Object.keys(subjectTopics).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u5e74\u7ea7"}</label>
                <input value={grade} onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{"\u77e5\u8bc6\u70b9"}</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={"\u8f93\u5165\u5177\u4f53\u77e5\u8bc6\u70b9"}
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
              <label className="text-xs text-gray-400 mb-1 block">{"\u8bfe\u5802\u9636\u6bb5"}</label>
              <div className="grid grid-cols-2 gap-2">
                {["\u65b0\u8bfe\u5bfc\u5165", "\u8bb2\u6388\u4e2d", "\u8bfe\u5802\u68c0\u6d4b", "\u603b\u7ed3\u590d\u4e60"].map((s) => (
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
              {loading ? "\u751f\u6210\u4e2d..." : "\u751f\u6210\u8bfe\u5802\u95ee\u7b54\u65b9\u6848"}
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

          {/* Answer Analyzer */}
          {analyzeMode && (
            <div className="bg-gray-900 rounded-xl border border-cyan-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-cyan-400">{"\u5373\u65f6\u56de\u7b54\u5206\u6790"}</h3>
                <button onClick={() => setAnalyzeMode(false)} className="text-xs text-gray-500 hover:text-gray-300">{"\u5173\u95ed"}</button>
              </div>
              <div className="bg-gray-800 rounded-lg p-2">
                <p className="text-xs text-gray-400">{"\u95ee\u9898\uff1a"}</p>
                <p className="text-xs text-gray-200">{selQuestion}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u5b66\u751f\u56de\u7b54"}</label>
                <textarea value={studentInput} onChange={(e) => setStudentInput(e.target.value)} rows={3}
                  placeholder={"\u8f93\u5165\u5b66\u751f\u7684\u56de\u7b54..."}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 resize-none" />
              </div>
              <button onClick={handleAnalyzeAnswer} disabled={analyzing || !studentInput.trim()}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-medium flex items-center justify-center gap-2">
                {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                {"AI \u5373\u65f6\u8bc4\u6790"}
              </button>
              {answerResult && (
                <div className="bg-gray-800/60 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${CORRECTNESS_COLOR[answerResult.correctness] || ""}`}>{answerResult.correctness}</span>
                    <span className="text-xs text-gray-400">{answerResult.score_percentage}{"\u5206"}</span>
                  </div>
                  {answerResult.what_is_right && <p className="text-xs text-emerald-400">&#10003; {answerResult.what_is_right}</p>}
                  {answerResult.what_is_wrong && <p className="text-xs text-amber-400">&#9651; {answerResult.what_is_wrong}</p>}
                  <p className="text-xs text-cyan-300">&#128161; {answerResult.hint}</p>
                  <div className="bg-gray-900 rounded p-2">
                    <p className="text-xs text-gray-400 mb-0.5">{"\u6559\u5e08\u793a\u8303\u56de\u5e94\uff1a"}</p>
                    <p className="text-xs text-white italic">&ldquo;{answerResult.teacher_response}&rdquo;</p>
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
              <p className="text-gray-500 text-sm">{"\u9009\u62e9\u5b66\u79d1\u4e0e\u77e5\u8bc6\u70b9\uff0c\u751f\u6210\u667a\u6167\u8bfe\u5802\u95ee\u7b54\u65b9\u6848"}</p>
            </div>
          )}

          {result && (
            <>
              {/* Knowledge overview */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> {"\u77e5\u8bc6\u70b9\u5168\u666f"}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">{"\u6838\u5fc3\u6982\u5ff5"}</p>
                    {result.knowledge_overview.core_concepts.map((c, i) => (
                      <p key={i} className="text-xs text-gray-300 mb-1 flex items-center gap-1"><ChevronRight className="w-3 h-3 text-cyan-400" />{c}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">{"\u524d\u7f6e\u77e5\u8bc6"}</p>
                    {result.knowledge_overview.prerequisite_knowledge.map((p, i) => (
                      <p key={i} className="text-xs text-gray-300 mb-1 flex items-center gap-1"><ChevronRight className="w-3 h-3 text-gray-500" />{p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">{"\u5e38\u89c1\u8bef\u533a"}</p>
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
                    { key: "socratic", label: "\u82cf\u683c\u62c9\u5e95\u95ee\u9898" },
                    { key: "check", label: "\u5feb\u901f\u68c0\u6d4b" },
                    { key: "traps", label: "\u6613\u9519\u9677\u9631" },
                    { key: "activities", label: "\u4e92\u52a8\u6d3b\u52a8" },
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
                              <p className="text-gray-500 mb-1">{"\u9884\u671f\u56de\u7b54\u65b9\u5411"}</p>
                              {q.expected_responses.map((r, j) => (
                                <p key={j} className="text-gray-300">&middot; {r}</p>
                              ))}
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">{"\u8ffd\u95ee\u65b9\u5411"}</p>
                              <p className="text-cyan-300">{q.follow_up}</p>
                            </div>
                          </div>
                          <button onClick={() => startAnalyze(q.question, q.expected_responses.join("\uff1b"))}
                            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline">
                            {"\u6a21\u62df\u5b66\u751f\u56de\u7b54 \u2192"}
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
                            <span className="text-gray-400">{"\u7b54\u6848\uff1a"}</span><span className="text-emerald-400">{qc.answer}</span>
                          </div>
                          <p className="text-xs text-amber-400/70 mt-1.5">&#9888; {qc.distractor_analysis}</p>
                          <button onClick={() => startAnalyze(qc.content, qc.answer)}
                            className="mt-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline">
                            {"\u5206\u6790\u5b66\u751f\u56de\u7b54 \u2192"}
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
                              <p className="text-xs text-rose-400 mb-0.5">{"\u5e38\u89c1\u9519\u8bef\u7b54\u6848"}</p>
                              <p className="text-xs text-gray-300">{trap.common_wrong_answer}</p>
                            </div>
                            <div className="bg-emerald-900/20 rounded p-2">
                              <p className="text-xs text-emerald-400 mb-0.5">{"\u6b63\u786e\u7b54\u6848"}</p>
                              <p className="text-xs text-gray-300">{trap.correct_answer}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">&#128218; {trap.explanation}</p>
                        </div>
                      ))}

                      {/* Differentiated questions */}
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-2">{"\u5dee\u5f02\u5316\u63d0\u95ee"}</p>
                        <div className="space-y-2">
                          {[
                            { label: "\u57fa\u7840", q: result.differentiated_questions.basic, color: "text-blue-400" },
                            { label: "\u6807\u51c6", q: result.differentiated_questions.standard, color: "text-emerald-400" },
                            { label: "\u6311\u6218", q: result.differentiated_questions.challenge, color: "text-amber-400" },
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
                            <span className="text-xs text-cyan-400">{act.duration_min}{"\u5206\u949f"}</span>
                          </div>
                          <p className="text-xs text-gray-300 mb-1">{act.description}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-cyan-400" />{"\u76ee\u7684\uff1a"}{act.purpose}
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
