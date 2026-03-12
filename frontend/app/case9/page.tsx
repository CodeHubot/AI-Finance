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
  "\u4f18\u79c0": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "\u826f\u597d": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "\u4e2d\u7b49": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "\u5f85\u63d0\u9ad8": "text-rose-400 bg-rose-400/10 border-rose-400/30",
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
  const [subject, setSubject] = useState("\u8bed\u6587");
  const [grade, setGrade] = useState("\u521d\u4e2d7-8\u5e74\u7ea7");
  const [assignmentType, setAssignmentType] = useState("\u4f5c\u6587/\u5199\u4f5c");
  const [title, setTitle] = useState("\u6211\u7684\u5bb6\u4e61");
  const [content, setContent] = useState("");
  const [grading, setGrading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);

  useEffect(() => {
    fetch(api.case9.config())
      .then((r) => r.json())
      .then((data) => { setConfig(data); })
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
    setProgress({ step: "\u521d\u59cb\u5316\u6279\u6539\u5f15\u64ce...", percent: 5 });
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
              <h1 className="text-sm font-semibold">{"\u6848\u4f8b 9\uff1a\u667a\u80fd\u4f5c\u4e1a\u6279\u6539\u7cfb\u7edf"}</h1>
              <p className="text-xs text-gray-400">{"AI \u9a71\u52a8\u7684\u4e2a\u6027\u5316\u4f5c\u4e1a\u8bc4\u4f30\u4e0e\u53cd\u9988"}</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">RAG</span>
            <span className="px-2 py-1 rounded bg-gray-800">{"\u8bc4\u5206\u91cf\u89c4"}</span>
            <span className="px-2 py-1 rounded bg-gray-800">{"\u4e2a\u6027\u5316\u53cd\u9988"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              {"\u4f5c\u4e1a\u4fe1\u606f\u914d\u7f6e"}
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u5b66\u79d1"}</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {(config?.subjects || ["\u8bed\u6587", "\u6570\u5b66", "\u82f1\u8bed"]).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{"\u5e74\u7ea7"}</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {(config?.grade_levels || ["\u521d\u4e2d7-8\u5e74\u7ea7"]).map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">{"\u4f5c\u4e1a\u7c7b\u578b"}</label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {(config?.assignment_types || ["\u4f5c\u6587/\u5199\u4f5c"]).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">{"\u4f5c\u4e1a\u9898\u76ee"}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={"\u8f93\u5165\u9898\u76ee..."}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sample selector */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-2">{"\u5feb\u901f\u52a0\u8f7d\u793a\u4f8b\u4f5c\u4e1a"}</p>
            <div className="flex flex-wrap gap-2">
              {(config?.samples || []).map((s, i) => (
                <button
                  key={i}
                  onClick={() => loadSample(i)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-indigo-600/20 border border-gray-700 hover:border-indigo-500 text-xs transition-all"
                >
                  {s.subject} &middot; {s.grade.replace("\u5e74\u7ea7", "")} &middot; {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Student work */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-300">{"\u5b66\u751f\u4f5c\u7b54\u5185\u5bb9"}</label>
              <button
                onClick={() => setContent("")}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> {"\u6e05\u7a7a"}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"\u5728\u6b64\u7c98\u8d34\u5b66\u751f\u7684\u4f5c\u4e1a\u5185\u5bb9..."}
              rows={10}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">{content.length} {"\u5b57"}</span>
              <button
                onClick={handleGrade}
                disabled={grading || !content.trim()}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 transition-all"
              >
                {grading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                {grading ? "AI\u6279\u6539\u4e2d..." : "\u5f00\u59cb\u667a\u80fd\u6279\u6539"}
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
              <p className="text-gray-500 text-sm">{"\u586b\u5199\u4f5c\u4e1a\u4fe1\u606f\u5e76\u70b9\u51fb\u300c\u5f00\u59cb\u667a\u80fd\u6279\u6539\u300d"}</p>
              <p className="text-gray-600 text-xs">{"AI \u5c06\u4ece\u591a\u4e2a\u7ef4\u5ea6\u8bc4\u5206\uff0c\u63d0\u4f9b\u4e2a\u6027\u5316\u6539\u8fdb\u5efa\u8bae"}</p>
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
                    <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-sm font-medium border ${GRADE_COLORS[result.grade_label] || GRADE_COLORS["\u826f\u597d"]}`}>
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
                <p className="text-xs text-indigo-400 font-medium mb-1">{"\u6559\u5e08\u8bc4\u8bed"}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{result.overall_comment}</p>
              </div>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> {"\u4f5c\u4e1a\u4eae\u70b9"}
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
                    <AlertCircle className="w-3.5 h-3.5" /> {"\u9519\u8bef\u4e0e\u6279\u6ce8"}
                  </h3>
                  <div className="space-y-3">
                    {result.errors.map((e, i) => (
                      <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">{e.error_type}</span>
                          <span className="text-xs text-gray-400">{"\u4f4d\u7f6e\uff1a"}{e.location}</span>
                        </div>
                        <p className="text-xs text-gray-300 mb-1">{e.explanation}</p>
                        <p className="text-xs text-emerald-400">&checkmark; {e.correction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> {"\u6539\u8fdb\u5efa\u8bae"}
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
