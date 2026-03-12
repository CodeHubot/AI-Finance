"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Loader2, CheckCircle, AlertCircle,
  Star, TrendingUp, ChevronRight, FileText, RotateCcw,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

interface SampleWork {
  subject: string;
  grade: string;
  type: string;
  title: string;
  content?: string;
}

interface RubricScore {
  dimension: string;
  score: number;
  full_score: number;
  comment: string;
}

interface ErrorItem {
  location: string;
  error_type: string;
  explanation: string;
  correction: string;
}

interface GradingResult {
  total_score: number;
  rubric_scores: RubricScore[];
  strengths: string[];
  errors: ErrorItem[];
  improvement_suggestions: string[];
  overall_comment: string;
  grade_label: string;
  reference_points: string[];
}

interface Config {
  subjects: string[];
  grade_levels: string[];
  assignment_types: string[];
  samples: SampleWork[];
}

const GRADE_COLORS: Record<string, string> = {
  优秀: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  良好: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  中等: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  待提�? "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

const SCORE_COLOR = (score: number, full: number) => {
  const pct = score / full;
  if (pct >= 0.85) return "text-emerald-400";
  if (pct >= 0.7) return "text-blue-400";
  if (pct >= 0.55) return "text-amber-400";
  return "text-rose-400";
};

export default function Case9Page() {
  const [config, setConfig] = useState<Config | null>(null);
  const [subject, setSubject] = useState("语文");
  const [grade, setGrade] = useState("初中7-8年级");
  const [assignmentType, setAssignmentType] = useState("作文/写作");
  const [title, setTitle] = useState("我的家乡");
  const [content, setContent] = useState("");
  const [grading, setGrading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);

  useEffect(() => {
    fetch(api.case9.config())
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
      })
      .catch(() => {});
    fetch(api.case9.sample(0))
      .then((r) => r.json())
      .then((s) => {
        setSubject(s.subject);
        setGrade(s.grade);
        setAssignmentType(s.type);
        setTitle(s.title);
        setContent(s.content || "");
      })
      .catch(() => {});
  }, []);

  const loadSample = async (index: number) => {
    try {
      const r = await fetch(api.case9.sample(index));
      const s = await r.json();
      setSubject(s.subject);
      setGrade(s.grade);
      setAssignmentType(s.type);
      setTitle(s.title);
      setContent(s.content || "");
      setResult(null);
    } catch {}
  };

  const handleGrade = async () => {
    if (!content.trim()) return;
    setGrading(true);
    setResult(null);
    setProgress({ step: "初始化批改引�?..", percent: 5 });
    try {
      await streamFetch(
        api.case9.grade(),
        { subject, grade, assignment_type: assignmentType, title, content },
        (data) => {
          if (data.type === "progress") {
            setProgress({ step: data.step as string, percent: data.percent as number });
          } else if (data.type === "done") {
            setResult(data.data as GradingResult);
            setProgress(null);
          }
        }
      );
    } finally {
      setGrading(false);
    }
  };

  const scorePercent = result ? result.total_score : 0;
  const scoreColor =
    scorePercent >= 85 ? "#34d399" :
    scorePercent >= 70 ? "#60a5fa" :
    scorePercent >= 55 ? "#fbbf24" : "#f87171";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">案例 9：智能作业批改系�?/h1>
              <p className="text-xs text-gray-400">AI 驱动的个性化作业评估与反�?/p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">RAG</span>
            <span className="px-2 py-1 rounded bg-gray-800">评分量规</span>
            <span className="px-2 py-1 rounded bg-gray-800">个性化反馈</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              作业信息配置
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">学科</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {(config?.subjects || ["语文", "数学", "英语"]).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">年级</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {(config?.grade_levels || ["初中7-8年级"]).map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">作业类型</label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {(config?.assignment_types || ["作文/写作"]).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">作业题目</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入题目..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sample selector */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-2">快速加载示例作�?/p>
            <div className="flex flex-wrap gap-2">
              {(config?.samples || []).map((s, i) => (
                <button
                  key={i}
                  onClick={() => loadSample(i)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-indigo-600/20 border border-gray-700 hover:border-indigo-500 text-xs transition-all"
                >
                  {s.subject} · {s.grade.replace("年级", "")} · {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Student work */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-300">学生作答内容</label>
              <button
                onClick={() => setContent("")}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> 清空
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此粘贴学生的作业内�?.."
              rows={10}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">{content.length} �?/span>
              <button
                onClick={handleGrade}
                disabled={grading || !content.trim()}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 transition-all"
              >
                {grading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                {grading ? "AI批改�?.." : "开始智能批�?}
              </button>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-indigo-300">{progress.step}</span>
                <span className="text-xs text-indigo-400">{progress.percent}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          {!result && !grading && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center h-full flex flex-col items-center justify-center gap-3">
              <BookOpen className="w-12 h-12 text-gray-700" />
              <p className="text-gray-500 text-sm">填写作业信息并点击「开始智能批改�?/p>
              <p className="text-gray-600 text-xs">AI 将从多个维度评分，提供个性化改进建议</p>
            </div>
          )}

          {result && (
            <>
              {/* Score overview */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold" style={{ color: scoreColor }}>
                        {result.total_score}
                      </span>
                      <span className="text-gray-500 text-lg">/100</span>
                    </div>
                    <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-sm font-medium border ${GRADE_COLORS[result.grade_label] || GRADE_COLORS["良好"]}`}>
                      {result.grade_label}
                    </span>
                  </div>
                  <div className="w-20 h-20 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#1f2937" strokeWidth="2.5" />
                      <circle
                        cx="18" cy="18" r="15.9155" fill="none"
                        stroke={scoreColor} strokeWidth="2.5"
                        strokeDasharray={`${result.total_score} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: scoreColor }}>
                      {result.total_score}%
                    </span>
                  </div>
                </div>

                {/* Rubric */}
                <div className="mt-4 space-y-2">
                  {result.rubric_scores.map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-20 shrink-0">{r.dimension}</span>
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(r.score / r.full_score) * 100}%`,
                            background: scoreColor,
                          }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold ${SCORE_COLOR(r.score, r.full_score)}`}>
                        {r.score}/{r.full_score}
                      </span>
                      <span className="text-xs text-gray-500 w-28 truncate">{r.comment}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall comment */}
              <div className="bg-indigo-900/20 border border-indigo-800/40 rounded-xl p-4">
                <p className="text-xs text-indigo-400 font-medium mb-1">教师评语</p>
                <p className="text-sm text-gray-300 leading-relaxed">{result.overall_comment}</p>
              </div>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> 作业亮点
                  </h3>
                  <ul className="space-y-1.5">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> 错误与批�?
                  </h3>
                  <div className="space-y-3">
                    {result.errors.map((e, i) => (
                      <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">{e.error_type}</span>
                          <span className="text-xs text-gray-400">位置：{e.location}</span>
                        </div>
                        <p className="text-xs text-gray-300 mb-1">{e.explanation}</p>
                        <p className="text-xs text-emerald-400">�?{e.correction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> 改进建议
                </h3>
                <ul className="space-y-2">
                  {result.improvement_suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      {s}
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

