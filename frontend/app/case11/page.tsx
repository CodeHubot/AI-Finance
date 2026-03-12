"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, PenTool, Loader2, Users, BookOpen,
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
  "\u5bfc\u5165": "from-amber-600 to-orange-600",
  "\u65b0\u77e5": "from-blue-600 to-indigo-600",
  "\u63a2\u7a76": "from-purple-600 to-violet-600",
  "\u7ec3\u4e60": "from-emerald-600 to-teal-600",
  "\u5c0f\u7ed3": "from-gray-600 to-gray-700",
  "\u603b\u7ed3": "from-gray-600 to-gray-700",
};

const getStageColor = (stage: string) => {
  for (const [key, color] of Object.entries(STAGE_COLORS)) {
    if (stage.includes(key)) return color;
  }
  return "from-blue-600 to-indigo-600";
};

export default function Case11Page() {
  const [samples, setSamples] = useState<SampleTopic[]>([]);
  const [subject, setSubject] = useState("\u6570\u5b66");
  const [grade, setGrade] = useState("\u9ad8\u4e2d\u4e00\u5e74\u7ea7");
  const [topic, setTopic] = useState("\u51fd\u6570\u7684\u5355\u8c03\u6027");
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
    setProgress({ step: "\u521d\u59cb\u5316...", percent: 5 });
    try {
      await streamFetch(
        api.case11.design(),
        { subject, grade, topic, duration, objectives, class_description: classDesc },
        (data) => {
          if (data.type === "progress") setProgress({ step: data.step as string, percent: data.percent as number });
          else if (data.type === "done") { setResult(data.data as LessonResult); setProgress(null); setActiveTab("flow"); }
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
              <h1 className="text-sm font-semibold">{"\u6848\u4f8b 11\uff1a\u667a\u80fd\u6559\u5b66\u8bbe\u8ba1\u52a9\u624b"}</h1>
              <p className="text-xs text-gray-400">{"\u4e00\u952e\u751f\u6210\u5b8c\u6574\u6559\u6848\uff0c\u89e3\u653e\u6559\u5e08\u521b\u9020\u529b"}</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">{"\u63d0\u793a\u8bcd\u5de5\u7a0b"}</span>
            <span className="px-2 py-1 rounded bg-gray-800">{"\u6559\u5b66\u8bbe\u8ba1"}</span>
            <span className="px-2 py-1 rounded bg-gray-800">{"\u5dee\u5f02\u5316\u6559\u5b66"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> {"\u8bfe\u7a0b\u4fe1\u606f"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u5b66\u79d1"}</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u5e74\u7ea7"}</label>
                <input value={grade} onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{"\u8bfe\u9898\u540d\u79f0"}</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={"\u4f8b\uff1a\u51fd\u6570\u7684\u5355\u8c03\u6027"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{"\u8bfe\u65f6\uff08\u5206\u949f\uff09"}</label>
              <div className="flex gap-2">
                {[45, 90].map((d) => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${duration === d ? "bg-amber-600/20 border-amber-500 text-amber-300" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                    {d}{"\u5206\u949f"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{"\u6559\u5b66\u76ee\u6807\uff08\u53ef\u9009\uff09"}</label>
              <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2}
                placeholder={"\u4f8b\uff1a\u638c\u63e1\u51fd\u6570\u5355\u8c03\u6027\u7684\u5b9a\u4e49\uff0c\u80fd\u5224\u65ad\u5e76\u8bc1\u660e\u51fd\u6570\u5355\u8c03\u6027"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{"\u73ed\u7ea7\u60c5\u51b5\uff08\u53ef\u9009\uff09"}</label>
              <input value={classDesc} onChange={(e) => setClassDesc(e.target.value)} placeholder={"\u4f8b\uff1a\u91cd\u70b9\u73ed\uff0c\u6574\u4f53\u57fa\u7840\u624e\u5b9e\uff0c\u6709\u521b\u65b0\u610f\u8bc6"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <button onClick={handleDesign} disabled={loading || !topic.trim()}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
              {loading ? "\u8bbe\u8ba1\u4e2d..." : "\u4e00\u952e\u751f\u6210\u6559\u5b66\u8bbe\u8ba1"}
            </button>
          </div>

          {/* Sample topics */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-2">{"\u5feb\u901f\u793a\u4f8b"}</p>
            <div className="space-y-1.5">
              {samples.map((s, i) => (
                <button key={i} onClick={() => loadSample(s)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-amber-600/10 border border-gray-700 hover:border-amber-500/50 text-xs text-gray-300 transition-all flex justify-between items-center">
                  <span>{s.subject} &middot; {s.topic}</span>
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
              <p className="text-gray-500 text-sm">{"\u8f93\u5165\u8bfe\u7a0b\u4fe1\u606f\uff0cAI \u81ea\u52a8\u751f\u6210\u5b8c\u6574\u6559\u5b66\u8bbe\u8ba1\u65b9\u6848"}</p>
            </div>
          )}

          {result && (
            <>
              {/* Overview */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{result.lesson_overview.topic}</h3>
                    <p className="text-xs text-gray-400">{result.lesson_overview.grade} &middot; {result.lesson_overview.subject} &middot; {result.lesson_overview.duration}{"\u5206\u949f"}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end max-w-xs">
                    {result.lesson_overview.teaching_methods.map((m, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">{m}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "\u77e5\u8bc6\u76ee\u6807", value: result.lesson_overview.objectives.knowledge, color: "text-blue-400" },
                    { label: "\u80fd\u529b\u76ee\u6807", value: result.lesson_overview.objectives.skill, color: "text-emerald-400" },
                    { label: "\u60c5\u611f\u76ee\u6807", value: result.lesson_overview.objectives.emotion, color: "text-amber-400" },
                  ].map((obj, i) => (
                    <div key={i} className="bg-gray-800/60 rounded-lg p-2">
                      <p className={`text-xs font-medium ${obj.color} mb-1`}>{obj.label}</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{obj.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{"\u6559\u5b66\u91cd\u70b9"}</p>
                    {result.lesson_overview.key_points.map((p, i) => (
                      <p key={i} className="text-xs text-gray-300 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{"\u6559\u5b66\u96be\u70b9"}</p>
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
                    { key: "flow", label: "\u6559\u5b66\u6d41\u7a0b" },
                    { key: "questions", label: "\u8bfe\u5802\u8ba8\u8bba" },
                    { key: "exercises", label: "\u7ec3\u4e60\u9898" },
                    { key: "homework", label: "\u4f5c\u4e1a" },
                    { key: "diff", label: "\u5dee\u5f02\u5316" },
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
                                <p className="text-xs text-gray-500 mb-0.5">{"\u6559\u5e08\u6d3b\u52a8"}</p>
                                <p className="text-xs text-gray-300">{stage.teacher_activity}</p>
                              </div>
                              <div className="bg-gray-800/60 rounded p-2">
                                <p className="text-xs text-gray-500 mb-0.5">{"\u5b66\u751f\u6d3b\u52a8"}</p>
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
                            <span className="text-xs text-gray-500">{"\u95ee\u9898 "}{i + 1}</span>
                          </div>
                          <p className="text-sm text-white mb-2">{q.question}</p>
                          <p className="text-xs text-gray-400">&#128161; {q.expected_answer_hints}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "exercises" && (
                    <div className="space-y-3">
                      {result.exercises.map((ex, i) => (
                        <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                          <span className={`text-xs px-2 py-0.5 rounded mb-2 inline-block ${ex.type === "\u57fa\u7840" ? "bg-blue-500/20 text-blue-400" : ex.type === "\u63d0\u9ad8" ? "bg-purple-500/20 text-purple-400" : "bg-rose-500/20 text-rose-400"}`}>
                            {ex.type}{"\u9898"}
                          </span>
                          <p className="text-sm text-white mb-2">{ex.content}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-900 rounded p-2">
                              <p className="text-xs text-gray-500">{"\u53c2\u8003\u7b54\u6848"}</p>
                              <p className="text-xs text-gray-300">{ex.answer}</p>
                            </div>
                            <div className="bg-gray-900 rounded p-2">
                              <p className="text-xs text-gray-500">{"\u89e3\u9898\u601d\u8def"}</p>
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
                        <p className="text-xs text-blue-400 mb-1">{"\u57fa\u7840\u4f5c\u4e1a\uff08\u5168\u4f53\u5fc5\u505a\uff09"}</p>
                        <p className="text-sm text-gray-300">{result.homework.basic}</p>
                      </div>
                      <div className="bg-purple-900/20 border border-purple-800/40 rounded-lg p-3">
                        <p className="text-xs text-purple-400 mb-1">{"\u63d0\u9ad8\u4f5c\u4e1a\uff08\u5b66\u6709\u4f59\u529b\uff09"}</p>
                        <p className="text-sm text-gray-300">{result.homework.advanced}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">{"\u8bbe\u8ba1\u76ee\u7684"}</p>
                        <p className="text-sm text-gray-300">{result.homework.purpose}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">{"\u677f\u4e66\u8bbe\u8ba1\u8981\u70b9"}</p>
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{result.board_design}</pre>
                      </div>
                    </div>
                  )}

                  {activeTab === "diff" && (
                    <div className="space-y-3">
                      <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-3">
                        <p className="text-xs text-amber-400 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> {"\u9488\u5bf9\u5b66\u56f0\u751f"}</p>
                        <p className="text-sm text-gray-300">{result.differentiation.for_struggling}</p>
                      </div>
                      <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg p-3">
                        <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> {"\u9488\u5bf9\u4f18\u7b49\u751f"}</p>
                        <p className="text-sm text-gray-300">{result.differentiation.for_advanced}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-2">{"\u8bfe\u540e\u53cd\u601d\u63d0\u793a"}</p>
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
