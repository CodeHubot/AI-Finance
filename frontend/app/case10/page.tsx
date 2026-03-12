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

const IMPORTANCE_COLOR = { high: "text-rose-400 bg-rose-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-gray-400 bg-gray-700" };
const PHASE_COLORS = [
  "from-blue-600 to-indigo-600",
  "from-emerald-600 to-teal-600",
  "from-purple-600 to-violet-600",
  "from-amber-600 to-orange-600",
];

export default function Case10Page() {
  const [subjects, setSubjects] = useState<Record<string, SubjectConfig>>({});
  const [subject, setSubject] = useState("高中数学");
  const [currentLevel, setCurrentLevel] = useState("");
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [goal, setGoal] = useState("高考数学达到140分以上");
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
    setProgress({ step: "初始化...", percent: 5 });
    try {
      await streamFetch(
        api.case10.generate(),
        { subject, current_level: currentLevel, weak_topics: weakTopics, goal, hours_per_week: hoursPerWeek, weeks },
        (data) => {
          if (data.type === "progress") setProgress({ step: data.step, percent: data.percent });
          else if (data.type === "done") { setResult(data.data); setProgress(null); setActivePhase(0); }
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
              <h1 className="text-sm font-semibold">案例 10：个性化学习路径规划</h1>
              <p className="text-xs text-gray-400">AI 诊断学情，生成定制化学习方案</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">学情诊断</span>
            <span className="px-2 py-1 rounded bg-gray-800">知识图谱</span>
            <span className="px-2 py-1 rounded bg-gray-800">自适应学习</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> 学情配置
            </h2>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">学科</label>
              <select value={subject} onChange={(e) => { setSubject(e.target.value); setWeakTopics([]); setCurrentLevel(subjects[e.target.value]?.levels[1] || ""); }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                {Object.keys(subjects).map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">当前水平</label>
              <select value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                {(currentConfig?.levels || []).map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">薄弱模块（可多选）</label>
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
              <label className="text-xs text-gray-400 mb-1 block">学习目标</label>
              <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="例：高考数学达到140分"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">每周学时</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={5} max={30} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(+e.target.value)} className="flex-1 accent-emerald-500" />
                  <span className="text-sm text-emerald-400 w-8">{hoursPerWeek}h</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">备考周期</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={4} max={52} value={weeks} onChange={(e) => setWeeks(+e.target.value)} className="flex-1 accent-emerald-500" />
                  <span className="text-sm text-emerald-400 w-8">{weeks}周</span>
                </div>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={loading || !subject}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "规划中..." : "生成个性化学习路径"}
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
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> 知识模块优先级
              </h3>
              <div className="space-y-1.5">
                {result.knowledge_map.slice(0, 8).map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${IMPORTANCE_COLOR[node.importance]}`}>
                      {node.importance === "high" ? "高" : node.importance === "medium" ? "中" : "低"}
                    </span>
                    <span className="text-xs text-gray-300">{node.node}</span>
                    {node.prerequisite && <span className="text-xs text-gray-600">← {node.prerequisite}</span>}
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
              <p className="text-gray-500 text-sm">配置学情信息后，AI 将为你定制专属学习路径</p>
            </div>
          )}

          {result && (
            <>
              {/* Diagnosis */}
              <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-emerald-400 mb-2">学情诊断</h3>
                <p className="text-sm text-gray-300 mb-2">{result.diagnosis.current_assessment}</p>
                <p className="text-xs text-amber-400 font-medium mb-1">优先突破：{result.diagnosis.priority_direction}</p>
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
                      阶段{p.phase_num}
                    </button>
                  ))}
                </div>
                {result.phases[activePhase] && (
                  <div className="p-5">
                    <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${PHASE_COLORS[activePhase % PHASE_COLORS.length]} text-xs font-medium mb-3`}>
                      {result.phases[activePhase].phase_name} · {result.phases[activePhase].duration_weeks}周
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">重点模块</p>
                        <ul className="space-y-1">
                          {result.phases[activePhase].focus_topics.map((t, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 text-emerald-400" />{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">每日安排</p>
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
                      <p className="text-xs text-gray-400 mb-0.5">阶段里程碑</p>
                      <p className="text-sm text-emerald-300">{result.phases[activePhase].milestone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">推荐资源</p>
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
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> 每周时间表模板
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "周一/三/五", value: result.weekly_schedule_template.mon_wed_fri },
                    { label: "周二/四", value: result.weekly_schedule_template.tue_thu },
                    { label: "周末", value: result.weekly_schedule_template.weekend },
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
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> 学习方法建议
                </h3>
                <ul className="space-y-1.5">
                  {result.tips.map((t, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✦</span>{t}
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
