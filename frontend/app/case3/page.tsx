"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  LineChart,
  Search,
  Loader2,
  Building2,
  GitBranch,
  Newspaper,
  Star,
  FileText,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Code2,
  RotateCcw,
  Info,
  FileDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { exportMarkdownToPdf } from "@/lib/export-pdf";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface IndustryChain {
  company: string;
  upstream: { name: string; examples: string[]; dependency: string }[];
  core: { name: string; products: string[]; core_competency: string };
  downstream: { name: string; examples: string[]; market_size: string }[];
  competitors: { name: string; position: string }[];
  industry_trend: string;
}

interface InfoSummary {
  announcements: { date: string; title: string; summary: string; sentiment: string }[];
  research_reports: {
    date: string;
    institution: string;
    rating: string;
    target_price: string;
    key_points: string[];
  }[];
  news_sentiment: { date: string; source: string; title: string; sentiment_score: number; sentiment_label: string }[];
  overall_sentiment: { score: number; label: string; summary: string };
}

interface ScoreData {
  company: string;
  scores: Record<string, { score: number; rationale: string; key_metrics: string[] }>;
  total_score: number;
  investment_rating: string;
  summary: string;
}

interface PromptTemplates {
  industry_chain: string;
  info_summary: string;
  score: string;
  report: string;
  variables: {
    common: { name: string; desc: string }[];
    report_extra: { name: string; desc: string }[];
  };
}

type Tab = "chain" | "info" | "score" | "report" | "prompts";

const SAMPLE_COMPANIES = [
  "贵州茅台", "宁德时代", "中国平安", "招商银行", "比亚迪",
  "中信证券", "东方财富", "海天味业", "工商银行",
];

const RATING_COLORS: Record<string, string> = {
  买入: "text-red-400 bg-red-500/20",
  增持: "text-orange-400 bg-orange-500/20",
  中性: "text-gray-400 bg-gray-500/20",
  减持: "text-blue-400 bg-blue-500/20",
  回避: "text-purple-400 bg-purple-500/20",
};

const SENTIMENT_ICON = (label: string) => {
  if (label === "正面" || label === "积极") return <TrendingUp size={12} className="text-emerald-400" />;
  if (label === "负面" || label === "消极") return <TrendingDown size={12} className="text-red-400" />;
  return <Minus size={12} className="text-gray-400" />;
};

const PROMPT_MODULES: { key: keyof Omit<PromptTemplates, "variables">; label: string; desc: string; color: string }[] = [
  { key: "industry_chain", label: "产业链分析提示词", desc: "控制上下游分析的深度、关注竞争对手数量、行业趋势风格", color: "emerald" },
  { key: "info_summary", label: "信息聚合提示词", desc: "控制公告/研报/舆情的数量、情绪分析维度、摘要详细程度", color: "blue" },
  { key: "score", label: "综合评分提示词", desc: "控制评分维度、评分标准严格度、各指标关注点", color: "violet" },
  { key: "report", label: "投研报告提示词", desc: "控制报告结构、字数要求、风险提示风格、投资建议口吻", color: "amber" },
];

export default function Case3Page() {
  const [company, setCompany] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chain");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<{
    chain: IndustryChain | null;
    info: InfoSummary | null;
    score: ScoreData | null;
    report: string;
  }>({ chain: null, info: null, score: null, report: "" });
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  // 提示词工坊
  const [defaultTemplates, setDefaultTemplates] = useState<PromptTemplates | null>(null);
  const [customPrompts, setCustomPrompts] = useState<Partial<Record<keyof Omit<PromptTemplates, "variables">, string>>>({});
  const [activePromptModule, setActivePromptModule] = useState<keyof Omit<PromptTemplates, "variables">>("industry_chain");

  useEffect(() => {
    fetch(api.case3.promptTemplates)
      .then((r) => r.json())
      .then((d: PromptTemplates) => setDefaultTemplates(d))
      .catch(() => {});
  }, []);

  const getPromptValue = (key: keyof Omit<PromptTemplates, "variables">) =>
    customPrompts[key] ?? defaultTemplates?.[key] ?? "";

  const isModified = (key: keyof Omit<PromptTemplates, "variables">) =>
    key in customPrompts && customPrompts[key] !== defaultTemplates?.[key];

  const anyModified = PROMPT_MODULES.some((m) => isModified(m.key));

  const resetPrompt = (key: keyof Omit<PromptTemplates, "variables">) => {
    setCustomPrompts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setLoadingKey = (key: string, val: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const fetchAll = async () => {
    if (!company.trim()) return;
    setError("");
    setData({ chain: null, info: null, score: null, report: "" });
    setActiveTab("chain");

    setLoadingKey("chain", true);
    setLoadingKey("info", true);
    setLoadingKey("score", true);

    const makeBody = (extra: Record<string, unknown> = {}) =>
      JSON.stringify({ company, ...extra });

    const [chainRes, infoRes, scoreRes] = await Promise.allSettled([
      fetch(api.case3.industryChain, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: makeBody(customPrompts.industry_chain ? { custom_prompt: customPrompts.industry_chain } : {}),
      }),
      fetch(api.case3.infoSummary, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: makeBody(customPrompts.info_summary ? { custom_prompt: customPrompts.info_summary } : {}),
      }),
      fetch(api.case3.score, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: makeBody(customPrompts.score ? { custom_prompt: customPrompts.score } : {}),
      }),
    ]);

    let chain: IndustryChain | null = null;
    let info: InfoSummary | null = null;
    let score: ScoreData | null = null;

    if (chainRes.status === "fulfilled" && chainRes.value.ok) chain = await chainRes.value.json();
    if (infoRes.status === "fulfilled" && infoRes.value.ok) info = await infoRes.value.json();
    if (scoreRes.status === "fulfilled" && scoreRes.value.ok) score = await scoreRes.value.json();

    setData((prev) => ({ ...prev, chain, info, score }));
    setLoadingKey("chain", false);
    setLoadingKey("info", false);
    setLoadingKey("score", false);

    if (!chain && !info && !score) setError("请求失败，请检查后端服务是否正常运行");
  };

  const generateReport = async () => {
    if (!data.chain && !data.score) return;
    setActiveTab("report");
    setLoadingKey("report", true);
    setData((prev) => ({ ...prev, report: "" }));

    try {
      const res = await fetch(api.case3.report, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          industry_chain: data.chain || {},
          summary: data.info || {},
          score: data.score || {},
          ...(customPrompts.report ? { custom_prompt: customPrompts.report } : {}),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;
            try {
              const d = JSON.parse(raw);
              if (d.token) {
                setData((prev) => ({ ...prev, report: prev.report + d.token }));
                reportRef.current?.scrollIntoView({ behavior: "smooth" });
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      setError(`报告生成失败：${err}`);
    } finally {
      setLoadingKey("report", false);
    }
  };

  const buildRadarOption = (score: ScoreData) => {
    const dimensions = Object.keys(score.scores);
    const values = dimensions.map((d) => score.scores[d].score);
    return {
      backgroundColor: "transparent",
      radar: {
        indicator: dimensions.map((d) => ({ name: d, max: 100 })),
        splitArea: { areaStyle: { color: ["rgba(255,255,255,0.03)", "rgba(255,255,255,0.01)"] } },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
        name: { textStyle: { color: "#9ca3af", fontSize: 12 } },
      },
      series: [{
        type: "radar",
        data: [{
          value: values,
          name: score.company,
          areaStyle: { color: "rgba(139, 92, 246, 0.2)" },
          lineStyle: { color: "#8b5cf6", width: 2 },
          itemStyle: { color: "#8b5cf6" },
        }],
      }],
    };
  };

  const hasData = data.chain || data.info || data.score;
  const isLoading = Object.values(loading).some(Boolean);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "chain", label: "产业链", icon: GitBranch },
    { key: "info", label: "信息摘要", icon: Newspaper },
    { key: "score", label: "综合评分", icon: Star },
    { key: "report", label: "投研报告", icon: FileText },
    { key: "prompts", label: "提示词工坊", icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* 顶部导航 */}
      <div className="h-14 border-b border-gray-800 flex items-center px-6 gap-4 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} />返回首页
        </Link>
        <div className="w-px h-5 bg-gray-700" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
            <LineChart size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">投研全流程实践</span>
          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full text-xs">企业投研</span>
        </div>
        {anyModified && (
          <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs flex items-center gap-1">
            <Code2 size={10} />使用自定义提示词
          </span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 公司搜索 */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-white">输入研究目标公司</h3>
            {anyModified && (
              <span className="text-xs text-amber-500/70 ml-2 flex items-center gap-1">
                <Info size={10} />提示词已自定义，将使用修改后的提示词生成结果
              </span>
            )}
          </div>
          <div className="flex gap-3 mb-3">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAll()}
              placeholder="输入公司名称，如：贵州茅台"
              className="flex-1 bg-gray-800/60 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <button
              onClick={fetchAll}
              disabled={!company.trim() || isLoading}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 text-sm font-medium text-white transition-colors"
            >
              {isLoading && !hasData ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              开始投研
            </button>
            {hasData && (
              <button
                onClick={generateReport}
                disabled={loading.report}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 text-sm font-medium text-white transition-colors"
              >
                {loading.report ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                生成报告
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_COMPANIES.map((c) => (
              <button
                key={c}
                onClick={() => setCompany(c)}
                className={`px-3 py-1 rounded-full text-xs transition-all border ${
                  company === c
                    ? "bg-violet-600/30 border-violet-500/60 text-violet-300"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-violet-500/40 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* 内容区域（含提示词工坊 Tab 始终可见）*/}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
          {/* Tab 导航 */}
          <div className="flex border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? tab.key === "prompts"
                      ? "text-amber-400 bg-amber-500/5"
                      : "text-violet-400 bg-violet-500/5"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {loading[tab.key] && tab.key !== "prompts" && (
                  <Loader2 size={13} className="animate-spin text-violet-400" />
                )}
                {!(loading[tab.key] && tab.key !== "prompts") && <tab.icon size={13} />}
                {tab.label}
                {tab.key === "prompts" && anyModified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-2.5 right-3" />
                )}
                {activeTab === tab.key && (
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.key === "prompts" ? "bg-amber-400" : "bg-violet-400"}`} />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* 产业链 Tab */}
            {activeTab === "chain" && (
              <div>
                {loading.chain && !data.chain && (
                  <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                    <Loader2 size={20} className="animate-spin text-violet-400" />
                    <span className="text-sm">AI 正在分析产业链结构...</span>
                  </div>
                )}
                {!hasData && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <GitBranch size={40} className="text-gray-700 mb-4" />
                    <p className="text-sm text-gray-500">输入公司名称，开始 AI 驱动的投研全流程分析</p>
                    <p className="text-gray-700 text-xs mt-1">覆盖产业链 · 信息摘要 · 企业评分 · 投研报告</p>
                  </div>
                )}
                {data.chain && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">上游供应链</h4>
                        <div className="space-y-2">
                          {data.chain.upstream.map((u, i) => (
                            <div key={i} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-white">{u.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  u.dependency === "高" ? "bg-red-500/20 text-red-400" :
                                  u.dependency === "中" ? "bg-yellow-500/20 text-yellow-400" :
                                  "bg-gray-700 text-gray-400"
                                }`}>依赖度：{u.dependency}</span>
                              </div>
                              <p className="text-xs text-gray-500">{u.examples.join("、")}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-3">
                          <ChevronRight size={16} className="text-gray-600" />
                          <span className="text-xs text-gray-500">核心业务</span>
                          <ChevronRight size={16} className="text-gray-600" />
                        </div>
                        <div className="w-full bg-violet-600/20 border-2 border-violet-500/40 rounded-2xl p-4 text-center">
                          <p className="text-lg font-bold text-violet-300 mb-2">{data.chain.core.name}</p>
                          <div className="flex flex-wrap gap-1 justify-center mb-2">
                            {data.chain.core.products.map((p, i) => (
                              <span key={i} className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">{p}</span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400">{data.chain.core.core_competency}</p>
                        </div>
                        <div className="mt-4 w-full bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-2">主要竞争对手</p>
                          {data.chain.competitors.map((comp, i) => (
                            <div key={i} className="text-xs text-gray-400 flex gap-1 mb-1">
                              <span className="text-gray-600">▪</span>
                              <span className="font-medium text-white">{comp.name}</span>：{comp.position}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">下游市场</h4>
                        <div className="space-y-2">
                          {data.chain.downstream.map((d, i) => (
                            <div key={i} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-white">{d.name}</span>
                                <span className="text-xs text-gray-500">{d.market_size}</span>
                              </div>
                              <p className="text-xs text-gray-500">{d.examples.join("、")}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <p className="text-xs text-blue-400 font-medium mb-1">行业发展趋势</p>
                      <p className="text-sm text-gray-300">{data.chain.industry_trend}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 信息摘要 Tab */}
            {activeTab === "info" && (
              <div>
                {loading.info && !data.info && (
                  <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                    <Loader2 size={20} className="animate-spin text-violet-400" />
                    <span className="text-sm">AI 正在聚合多源信息...</span>
                  </div>
                )}
                {data.info && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-blue-500 rounded-full" />公司公告
                      </h4>
                      <div className="space-y-2 mb-6">
                        {data.info.announcements.map((a, i) => (
                          <div key={i} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                a.sentiment === "positive" ? "bg-emerald-500/20 text-emerald-400" :
                                a.sentiment === "negative" ? "bg-red-500/20 text-red-400" :
                                "bg-gray-700 text-gray-400"
                              }`}>
                                {a.sentiment === "positive" ? "利好" : a.sentiment === "negative" ? "利空" : "中性"}
                              </span>
                              <span className="text-xs text-gray-600">{a.date}</span>
                            </div>
                            <p className="text-sm text-white mb-1">{a.title}</p>
                            <p className="text-xs text-gray-400">{a.summary}</p>
                          </div>
                        ))}
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-amber-500 rounded-full" />舆情监控
                      </h4>
                      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white">整体情绪</span>
                          <span className={`text-sm font-semibold ${
                            data.info.overall_sentiment.label === "积极" ? "text-emerald-400" :
                            data.info.overall_sentiment.label === "消极" ? "text-red-400" : "text-gray-400"
                          }`}>
                            {data.info.overall_sentiment.label}（{(data.info.overall_sentiment.score * 100).toFixed(0)}分）
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{data.info.overall_sentiment.summary}</p>
                      </div>
                      <div className="space-y-1.5">
                        {data.info.news_sentiment.map((n, i) => (
                          <div key={i} className="flex items-start gap-2 bg-gray-800/40 rounded-lg p-2">
                            {SENTIMENT_ICON(n.sentiment_label)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white truncate">{n.title}</p>
                              <p className="text-xs text-gray-600">{n.source} · {n.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-violet-500 rounded-full" />机构研报
                      </h4>
                      <div className="space-y-3">
                        {data.info.research_reports.map((r, i) => (
                          <div key={i} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">{r.institution}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RATING_COLORS[r.rating] || "bg-gray-700 text-gray-400"}`}>
                                  {r.rating}
                                </span>
                                <span className="text-xs text-gray-500">{r.date}</span>
                              </div>
                            </div>
                            {r.target_price && <p className="text-xs text-amber-400 mb-2">目标价：{r.target_price}</p>}
                            <ul className="space-y-1">
                              {r.key_points.map((point, j) => (
                                <li key={j} className="text-xs text-gray-400 flex gap-1">
                                  <span className="text-violet-500 flex-shrink-0">·</span>{point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 综合评分 Tab */}
            {activeTab === "score" && (
              <div>
                {loading.score && !data.score && (
                  <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                    <Loader2 size={20} className="animate-spin text-violet-400" />
                    <span className="text-sm">AI 正在构建评分模型...</span>
                  </div>
                )}
                {data.score && (
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-violet-400 mb-1">{data.score.total_score}</p>
                        <p className="text-xs text-gray-500">综合评分（满分 100）</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                          data.score.investment_rating === "强烈推荐" ? "bg-emerald-500/20 text-emerald-400" :
                          data.score.investment_rating === "推荐" ? "bg-blue-500/20 text-blue-400" :
                          data.score.investment_rating === "中性" ? "bg-gray-600 text-gray-300" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {data.score.investment_rating}
                        </span>
                      </div>
                      <ReactECharts
                        option={buildRadarOption(data.score)}
                        style={{ height: 300 }}
                        opts={{ renderer: "canvas" }}
                      />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-white mb-4">评分维度明细</h4>
                      {Object.entries(data.score.scores).map(([dim, info]) => (
                        <div key={dim} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">{dim}</span>
                            <span className={`text-sm font-bold ${
                              info.score >= 80 ? "text-emerald-400" :
                              info.score >= 60 ? "text-blue-400" :
                              info.score >= 40 ? "text-yellow-400" : "text-red-400"
                            }`}>{info.score}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                            <div className={`h-1.5 rounded-full ${
                              info.score >= 80 ? "bg-emerald-400" :
                              info.score >= 60 ? "bg-blue-400" :
                              info.score >= 40 ? "bg-yellow-400" : "bg-red-400"
                            }`} style={{ width: `${info.score}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{info.rationale}</p>
                          <div className="flex flex-wrap gap-1">
                            {info.key_metrics.map((m, i) => (
                              <span key={i} className="text-xs text-gray-600 bg-gray-700/50 px-1.5 py-0.5 rounded">{m}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 mt-2">
                        <p className="text-xs text-violet-400 font-medium mb-1">AI 综合评价</p>
                        <p className="text-sm text-gray-300">{data.score.summary}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 投研报告 Tab */}
            {activeTab === "report" && (
              <div>
                {loading.report && data.report.length < 100 && (
                  <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
                    <Loader2 size={20} className="animate-spin text-amber-400" />
                    <span className="text-sm">AI 正在撰写投研报告...</span>
                  </div>
                )}
                {!loading.report && !data.report && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText size={40} className="text-gray-700 mb-4" />
                    <p className="text-sm text-gray-500 mb-3">完成产业链分析和评分后，点击「生成报告」</p>
                    <button
                      onClick={generateReport}
                      disabled={!data.chain && !data.score}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm text-white transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} />一键生成投研报告
                    </button>
                  </div>
                )}
                {data.report && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        {loading.report ? (
                          <><Loader2 size={12} className="animate-spin" />正在生成...</>
                        ) : "报告生成完成"}
                      </p>
                      {!loading.report && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => exportMarkdownToPdf(data.report, `${company}_投研报告`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 rounded-lg text-xs text-white transition-colors"
                          >
                            <FileDown size={12} />导出 PDF
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([data.report], { type: "text/markdown" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${company}_投研报告.md`;
                              a.click();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                          >
                            <Download size={12} />导出 Markdown
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.report}</ReactMarkdown>
                      {loading.report && (
                        <span className="inline-block w-1 h-4 bg-amber-400 cursor-blink align-text-bottom" />
                      )}
                    </div>
                    <div ref={reportRef} />
                  </div>
                )}
              </div>
            )}

            {/* ── 提示词工坊 Tab ── */}
            {activeTab === "prompts" && (
              <div className="space-y-6">
                {/* 说明 */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-sm text-amber-300 font-medium mb-2">提示词工坊 — 教学核心功能</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    本平台投研分析分为 <strong className="text-white">4 个模块</strong>，每个模块都会独立调用大模型。
                    在这里你可以查看并自定义每个模块的提示词，点击「开始投研」后 AI 将使用修改后的提示词生成结果。
                    <br />尝试修改：评分提示词中增加&ldquo;重点关注 ESG&rdquo;，或报告提示词中要求&ldquo;使用更保守的语言&rdquo;，对比结果差异。
                  </p>
                </div>

                {/* 模块选择 */}
                <div className="flex gap-2 flex-wrap">
                  {PROMPT_MODULES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setActivePromptModule(m.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                        activePromptModule === m.key
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      {isModified(m.key) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* 当前模块编辑区 */}
                {PROMPT_MODULES.filter((m) => m.key === activePromptModule).map((m) => (
                  <div key={m.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{m.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isModified(m.key) && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">已修改</span>
                        )}
                        <button
                          onClick={() => resetPrompt(m.key)}
                          disabled={!isModified(m.key)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          <RotateCcw size={11} />重置默认
                        </button>
                      </div>
                    </div>

                    {/* 变量说明 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-600">变量：</span>
                      {(defaultTemplates?.variables.common || []).map((v) => (
                        <span key={v.name} className="group relative">
                          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-xs font-mono cursor-help border border-emerald-500/20">
                            {"{" + v.name + "}"}
                          </span>
                          <span className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                            {v.desc}
                          </span>
                        </span>
                      ))}
                      {m.key === "report" && (defaultTemplates?.variables.report_extra || []).map((v) => (
                        <span key={v.name} className="group relative">
                          <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded text-xs font-mono cursor-help border border-blue-500/20">
                            {"{" + v.name + "}"}
                          </span>
                          <span className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                            {v.desc}
                          </span>
                        </span>
                      ))}
                    </div>

                    <textarea
                      value={getPromptValue(m.key)}
                      onChange={(e) =>
                        setCustomPrompts((prev) => ({ ...prev, [m.key]: e.target.value }))
                      }
                      rows={16}
                      className="w-full bg-gray-800/60 border border-gray-700 focus:border-amber-500/60 rounded-xl px-4 py-3 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none resize-none"
                    />
                    <p className="text-xs text-gray-600">
                      修改后返回公司搜索框，点击「开始投研」即可看到不同提示词带来的结果差异
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
