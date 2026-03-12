"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, GraduationCap, Loader2, BookOpen, FileText,
  Search, ChevronRight, Calendar, CheckCircle, AlertCircle,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

interface ResearchResult {
  research_landscape: {
    overview: string;
    key_schools: string[];
    hot_topics: string[];
    research_gaps: string[];
  };
  paper_structure: {
    title_suggestions: string[];
    abstract_framework: string;
    chapters: { chapter: string; content_points: string[]; pages: string }[];
  };
  methodology: {
    recommended_methods: { method: string; applicability: string; tools: string[]; strength: string }[];
    data_sources: string[];
    analysis_framework: string;
  };
  key_arguments: { argument: string; supporting_logic: string; potential_counter: string }[];
  literature_reading_strategy: {
    must_read_types: string[];
    search_keywords: string[];
    databases: string[];
  };
  timeline: { phase: string; duration: string; deliverable: string }[];
  writing_tips: string[];
}

interface WritingCheckResult {
  overall_score: number;
  dimension_scores: { dimension: string; score: number; full_score: number; feedback: string }[];
  issues: { type: string; location: string; suggestion: string }[];
  strengths: string[];
  revised_example: string;
  overall_advice: string;
}

export default function Case12Page() {
  const [mode, setMode] = useState<"research" | "writing">("research");
  const [directions, setDirections] = useState<string[]>([]);
  const [sampleAbstracts, setSampleAbstracts] = useState("");
  const [topic, setTopic] = useState("人工智能在个性化教育中的应用研究");
  const [question, setQuestion] = useState("大语言模型如何改变学生的学习方式？");
  const [direction, setDirection] = useState("人工智能与教育技术");
  const [abstracts, setAbstracts] = useState("");
  const [writingText, setWritingText] = useState("");
  const [paperType, setPaperType] = useState("学术论文");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [writingResult, setWritingResult] = useState<WritingCheckResult | null>(null);
  const [activeTab, setActiveTab] = useState("landscape");

  useEffect(() => {
    fetch(api.case12.directions())
      .then((r) => r.json())
      .then((d) => setDirections(d.directions || []))
      .catch(() => {});
    fetch(api.case12.sampleAbstracts())
      .then((r) => r.json())
      .then((d) => setSampleAbstracts(d.abstracts || ""))
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setResearchResult(null);
    setProgress({ step: "初始化...", percent: 5 });
    try {
      await streamFetch(
        api.case12.analyze(),
        { topic, research_question: question, direction, abstracts },
        (data) => {
          if (data.type === "progress") setProgress({ step: data.step as string, percent: data.percent as number });
          else if (data.type === "done") { setResearchResult(data.data as ResearchResult); setProgress(null); setActiveTab("landscape"); }
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWritingCheck = async () => {
    setLoading(true);
    setWritingResult(null);
    setProgress({ step: "分析中...", percent: 30 });
    try {
      await streamFetch(
        api.case12.checkWriting(),
        { text: writingText, paper_type: paperType },
        (data) => {
          if (data.type === "progress") setProgress({ step: data.step as string, percent: data.percent as number });
          else if (data.type === "done") { setWritingResult(data.data as WritingCheckResult); setProgress(null); }
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">案例 12：高校学术研究助手</h1>
              <p className="text-xs text-gray-400">AI 辅助文献综述、论文框架与写作规范检查</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded bg-gray-800">RAG</span>
            <span className="px-2 py-1 rounded bg-gray-800">学术写作</span>
            <span className="px-2 py-1 rounded bg-gray-800">CoT推理</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Mode switcher */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode("research")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === "research" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            <Search className="w-4 h-4" /> 文献综述 & 研究规划
          </button>
          <button onClick={() => setMode("writing")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === "writing" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            <FileText className="w-4 h-4" /> 学术写作检查
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input */}
          <div className="lg:col-span-2 space-y-4">
            {mode === "research" ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" /> 研究信息
                </h2>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">研究方向</label>
                  <select value={direction} onChange={(e) => setDirection(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
                    {directions.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">研究主题</label>
                  <input value={topic} onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">核心研究问题</label>
                  <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="你最想回答的核心问题"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-400">已有文献摘要（可选）</label>
                    <button onClick={() => setAbstracts(sampleAbstracts)} className="text-xs text-purple-400 hover:text-purple-300">加载示例</button>
                  </div>
                  <textarea value={abstracts} onChange={(e) => setAbstracts(e.target.value)} rows={5}
                    placeholder="粘贴相关文献的摘要，AI将结合分析研究空白..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <button onClick={handleAnalyze} disabled={loading || !topic.trim()}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {loading ? "分析中..." : "生成研究规划"}
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> 写作检查
                </h2>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">论文类型</label>
                  <select value={paperType} onChange={(e) => setPaperType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
                    {["学术论文", "毕业论文", "课程论文", "研究报告", "文献综述"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">待检查的论文片段</label>
                  <textarea value={writingText} onChange={(e) => setWritingText(e.target.value)} rows={10}
                    placeholder="粘贴你的论文段落（摘要、引言或某章节）..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none" />
                  <p className="text-xs text-gray-500 mt-1">{writingText.length}/2000 字</p>
                </div>
                <button onClick={handleWritingCheck} disabled={loading || !writingText.trim()}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {loading ? "检查中..." : "学术规范检查"}
                </button>
              </div>
            )}

            {progress && (
              <div className="bg-purple-900/20 border border-purple-800/50 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-purple-300">{progress.step}</span>
                  <span className="text-xs text-purple-400">{progress.percent}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="lg:col-span-3 space-y-4">
            {!researchResult && !writingResult && !loading && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center h-full flex flex-col items-center justify-center gap-3">
                <GraduationCap className="w-12 h-12 text-gray-700" />
                <p className="text-gray-500 text-sm">填写研究信息，获取AI学术研究辅助</p>
              </div>
            )}

            {mode === "research" && researchResult && (
              <>
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="flex border-b border-gray-800 overflow-x-auto">
                    {[
                      { key: "landscape", label: "领域全景" },
                      { key: "structure", label: "论文框架" },
                      { key: "method", label: "研究方法" },
                      { key: "timeline", label: "研究计划" },
                    ].map((tab) => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-gray-800 text-purple-400" : "text-gray-500 hover:text-gray-300"}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4">
                    {activeTab === "landscape" && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-300">{researchResult.research_landscape.overview}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-2">研究热点</p>
                            {researchResult.research_landscape.hot_topics.map((t, i) => (
                              <span key={i} className="inline-block mr-1 mb-1 px-2 py-0.5 text-xs rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">{t}</span>
                            ))}
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-2">主要研究视角</p>
                            {researchResult.research_landscape.key_schools.map((s, i) => (
                              <p key={i} className="text-xs text-gray-300 flex items-center gap-1 mb-1"><ChevronRight className="w-3 h-3 text-purple-400" />{s}</p>
                            ))}
                          </div>
                        </div>
                        <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-3">
                          <p className="text-xs text-amber-400 mb-1.5">研究空白（你的机会）</p>
                          {researchResult.research_landscape.research_gaps.map((g, i) => (
                            <p key={i} className="text-xs text-gray-300 flex items-start gap-1.5 mb-1">
                              <span className="text-amber-400 mt-0.5">→</span>{g}
                            </p>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1.5">检索关键词推荐</p>
                          <div className="flex flex-wrap gap-1.5">
                            {researchResult.literature_reading_strategy.search_keywords.map((kw, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">{kw}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "structure" && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-2">论文题目建议</p>
                          {researchResult.paper_structure.title_suggestions.map((t, i) => (
                            <div key={i} className="bg-gray-800/60 rounded-lg p-2.5 mb-2">
                              <span className="text-xs text-purple-400 mr-1">方案{i + 1}：</span>
                              <span className="text-sm text-white">{t}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-gray-800/60 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">摘要结构建议</p>
                          <p className="text-sm text-gray-300">{researchResult.paper_structure.abstract_framework}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-2">章节框架</p>
                          <div className="space-y-2">
                            {researchResult.paper_structure.chapters.map((ch, i) => (
                              <div key={i} className="flex gap-3">
                                <span className="w-5 h-5 rounded bg-purple-600/30 text-purple-300 text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-sm text-white">{ch.chapter}</span>
                                    <span className="text-xs text-gray-500">{ch.pages}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {ch.content_points.map((cp, j) => (
                                      <span key={j} className="text-xs text-gray-400">{j > 0 ? "· " : ""}{cp}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "method" && (
                      <div className="space-y-3">
                        {researchResult.methodology.recommended_methods.map((m, i) => (
                          <div key={i} className="bg-gray-800/60 rounded-lg p-3">
                            <p className="text-sm font-medium text-white mb-1">{m.method}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-gray-500">适用场景：</span><span className="text-gray-300">{m.applicability}</span></div>
                              <div><span className="text-gray-500">主要优势：</span><span className="text-gray-300">{m.strength}</span></div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {m.tools.map((t, j) => (
                                <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">{t}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="bg-gray-800/60 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">分析框架建议</p>
                          <p className="text-sm text-gray-300">{researchResult.methodology.analysis_framework}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === "timeline" && (
                      <div className="space-y-2">
                        {researchResult.timeline.map((item, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500 text-purple-300 text-xs flex items-center justify-center">{i + 1}</div>
                              {i < researchResult.timeline.length - 1 && <div className="w-0.5 h-full min-h-[20px] bg-gray-800 mt-1" />}
                            </div>
                            <div className="flex-1 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white">{item.phase}</span>
                                <span className="text-xs text-gray-500 flex items-center gap-0.5"><Calendar className="w-3 h-3" />{item.duration}</span>
                              </div>
                              <p className="text-xs text-purple-300 mt-0.5">产出：{item.deliverable}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {mode === "writing" && writingResult && (
              <>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-4xl font-bold text-purple-400">{writingResult.overall_score}</span>
                      <span className="text-gray-500 ml-1">/100</span>
                    </div>
                    <p className="text-sm text-gray-400 max-w-xs text-right">{writingResult.overall_advice}</p>
                  </div>
                  <div className="space-y-2">
                    {writingResult.dimension_scores.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-24 shrink-0">{d.dimension}</span>
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(d.score / d.full_score) * 100}%` }} />
                        </div>
                        <span className="text-xs text-purple-400 font-mono">{d.score}/{d.full_score}</span>
                        <span className="text-xs text-gray-500 w-40 truncate">{d.feedback}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <h3 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> 写作亮点
                    </h3>
                    {writingResult.strengths.map((s, i) => (
                      <p key={i} className="text-xs text-gray-300 mb-1">✓ {s}</p>
                    ))}
                  </div>
                  <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <h3 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 待改进问题
                    </h3>
                    {writingResult.issues.map((issue, i) => (
                      <div key={i} className="mb-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 mr-1">{issue.type}</span>
                        <span className="text-xs text-gray-400">{issue.location}</span>
                        <p className="text-xs text-gray-300 mt-0.5 pl-2">→ {issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="text-xs font-semibold text-purple-400 mb-2">修改示例</h3>
                  <p className="text-sm text-gray-300">{writingResult.revised_example}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
