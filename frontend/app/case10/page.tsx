"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Map, Loader2, ChevronRight, Target, Clock,
  BookOpen, Zap, Calendar, TrendingUp,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

interface SubjectConfig {
  topics: string[];
  levels: string[];
}

interface Phase {
  phase_num: number;
  phase_name: string;
  duration_weeks: number;
  focus_topics: string[];
  weekly_plan: { days_per_week: number; hours_per_day: number; activities: string[] };
  milestone: string;
  resources: string[];
}

interface KnowledgeNode {
  node: string;
  prerequisite: string | null;
  importance: "high" | "medium" | "low";
}

interface PathResult {
  diagnosis: { current_assessment: string; key_gaps: string[]; priority_direction: string };
  phases: Phase[];
  knowledge_map: KnowledgeNode[];
  tips: string[];
  weekly_schedule_template: { mon_wed_fri: string; tue_thu: string; weekend: string };
}

const IMPORTANCE_COLOR = {
  high: "text-rose-400 bg-rose-400/10",
  medium: "text-amber-400 bg-amber-400/10",
  low: "text-gray-400 bg-gray-700",
};

const PHASE_COLORS = [
  "from-blue-600 to-indigo-600",
  "from-emerald-600 to-teal-600",
  "from-purple-600 to-violet-600",
  "from-amber-600 to-orange-600",
];

export default function Case10Page() {
  const [subjects, setSubjects] = useState<Record<string, SubjectConfig>>({});
  const [subject, setSubject] = useState("\u9ad8\u4e2d\u6570\u5b66");
  const [currentLevel, setCurrentLevel] = useState("");
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [goal, setGoal] = useState("\u9ad8\u8003\u6570\u5b66\u8fbe\u5230140\u5206\u4ee5\u4e0a");
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [weeks, setWeeks] = useState(12);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [result, setResult] = useState<PathResult | null>(null);
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    fetch(api.case10.subjects())
      .then((r) => r.json())
      .then((data) => {
        setSubjects(data);
        const first = Object.keys(data)[0];
        if (first) {
          setSubject(first);
          setCurrentLevel(data[first].levels[1]);
        }
      })
      .catch(() => {});
  }, []);

  const currentConfig = subjects[subject];

  const toggleTopic = (t: string) => {
    setWeakTopics((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setProgress({ step: "\u521d\u59cb\u5316...", percent: 5 });
    try {
      await streamFetch(
        api.case10.generate(),
        { subject, current_level: currentLevel, weak_topics: weakTopics, goal, hours_per_week: hoursPerWeek, weeks },
        (data) => {
          if (data.type === "progress") setProgress({ step: data.step as string, percent: data.percent as number });
          else if (data.type === "done") { setResult(data.data as PathResult); setProgress(null); setActivePhase(0); }
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Map className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">{"\u6848\u4f8b 10\uff1a\u4e2a\u6027\u5316\u5b66\u4e60\u8def\u5f84\u89c4\u5212"}</h1>
              <p className="text-xs text-gray-400">{"AI \u8bca\u65ad\u5b66\u60c5\uff0c\u751f\u6210\u5b9a\u5236\u5316\u5b66\u4e60\u65b9\u6848"}</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">{"\u5b66\u60c5\u8bca\u65ad"}</span>
            <span className="px-2 py-1 rounded bg-gray-800">{"\u77e5\u8bc6\u56fe\u8c31"}</span>
            <span className="px-2 py-1 rounded bg-gray-800">{"\u81ea\u9002\u5e94\u5b66\u4e60"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> {"\u5b66\u60c5\u914d\u7f6e"}
            </h2>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{"\u5b66\u79d1"}</label>
              <select value={subject} onChange={(e) => { setSubject(e.target.value); setWeakTopics([]); setCurrentLevel(subjects[e.target.value]?.levels[1] || ""); }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                {Object.keys(subjects).map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{"\u5f53\u524d\u6c34\u5e73"}</label>
              <select value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                {(currentConfig?.levels || []).map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">{"\u8584\u5f31\u6a21\u5757\uff08\u53ef\u591a\u9009\uff09"}</label>
              <div className="flex flex-wrap gap-2">
                {(currentConfig?.topics || []).map((t) => (
                  <button key={t} onClick={() => toggleTopic(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${weakTopics.includes(t) ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{"\u5b66\u4e60\u76ee\u6807"}</label>
              <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={"\u4f8b\uff1a\u9ad8\u8003\u6570\u5b66\u8fbe\u5230140\u5206"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u6bcf\u5468\u5b66\u65f6"}</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={5} max={30} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(+e.target.value)} className="flex-1 accent-emerald-500" />
                  <span className="text-sm text-emerald-400 w-8">{hoursPerWeek}h</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u5907\u8003\u5468\u671f"}</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={4} max={52} value={weeks} onChange={(e) => setWeeks(+e.target.value)} className="flex-1 accent-emerald-500" />
                  <span className="text-sm text-emerald-400 w-8">{weeks}{"\u5468"}</span>
                </div>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={loading || !subject}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "\u89c4\u5212\u4e2d..." : "\u751f\u6210\u4e2a\u6027\u5316\u5b66\u4e60\u8def\u5f84"}
            </button>
          </div>

          {progress && (
            <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-emerald-300">{progress.step}</span>
                <span className="text-xs text-emerald-400">{progress.percent}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          )}

          {/* Knowledge Map */}
          {result && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> {"\u77e5\u8bc6\u6a21\u5757\u4f18\u5148\u7ea7"}
              </h3>
              <div className="space-y-1.5">
                {result.knowledge_map.slice(0, 8).map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${IMPORTANCE_COLOR[node.importance]}`}>
                      {node.importance === "high" ? "\u9ad8" : node.importance === "medium" ? "\u4e2d" : "\u4f4e"}
                    </span>
                    <span className="text-xs text-gray-300">{node.node}</span>
                    {node.prerequisite && <span className="text-xs text-gray-600">&larr; {node.prerequisite}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !loading && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center flex flex-col items-center gap-3 h-full justify-center">
              <Map className="w-12 h-12 text-gray-700" />
              <p className="text-gray-500 text-sm">{"\u914d\u7f6e\u5b66\u60c5\u4fe1\u606f\u540e\uff0cAI \u5c06\u4e3a\u4f60\u5b9a\u5236\u4e13\u5c5e\u5b66\u4e60\u8def\u5f84"}</p>
            </div>
          )}

          {result && (
            <>
              {/* Diagnosis */}
              <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-emerald-400 mb-2">{"\u5b66\u60c5\u8bca\u65ad"}</h3>
                <p className="text-sm text-gray-300 mb-2">{result.diagnosis.current_assessment}</p>
                <p className="text-xs text-amber-400 font-medium mb-1">{"\u4f18\u5148\u7a81\u7834\uff1a"}{result.diagnosis.priority_direction}</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.diagnosis.key_gaps.map((g, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">{g}</span>
                  ))}
                </div>
              </div>

              {/* Phase tabs */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="flex border-b border-gray-800">
                  {result.phases.map((p, i) => (
                    <button key={i} onClick={() => setActivePhase(i)}
                      className={`flex-1 py-2.5 text-xs font-medium transition-all ${activePhase === i ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                      {"\u9636\u6bb5"}{p.phase_num}
                    </button>
                  ))}
                </div>
                {result.phases[activePhase] && (
                  <div className="p-5">
                    <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${PHASE_COLORS[activePhase % PHASE_COLORS.length]} text-xs font-medium mb-3`}>
                      {result.phases[activePhase].phase_name} &middot; {result.phases[activePhase].duration_weeks}{"\u5468"}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">{"\u91cd\u70b9\u6a21\u5757"}</p>
                        <ul className="space-y-1">
                          {result.phases[activePhase].focus_topics.map((t, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 text-emerald-400" />{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">{"\u6bcf\u65e5\u5b89\u6392"}</p>
                        <ul className="space-y-1">
                          {result.phases[activePhase].weekly_plan.activities.map((a, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-teal-400" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-400 mb-0.5">{"\u9636\u6bb5\u91cc\u7a0b\u7891"}</p>
                      <p className="text-sm text-emerald-300">{result.phases[activePhase].milestone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">{"\u63a8\u8350\u8d44\u6e90"}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.phases[activePhase].resources.map((r, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly schedule */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {"\u6bcf\u5468\u65f6\u95f4\u8868\u6a21\u677f"}
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "\u5468\u4e00/\u4e09/\u4e94", value: result.weekly_schedule_template.mon_wed_fri },
                    { label: "\u5468\u4e8c/\u56db", value: result.weekly_schedule_template.tue_thu },
                    { label: "\u5468\u672b", value: result.weekly_schedule_template.weekend },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-emerald-400 w-16 shrink-0">{item.label}</span>
                      <span className="text-xs text-gray-300">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> {"\u5b66\u4e60\u65b9\u6cd5\u5efa\u8bae"}
                </h3>
                <ul className="space-y-1.5">
                  {result.tips.map((t, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">&#10022;</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
