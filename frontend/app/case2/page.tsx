"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  BarChart3,
  Search,
  Loader2,
  Sparkles,
  TrendingUp,
  Database,
  FileBarChart,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  Code2,
  Table2,
  FileDown,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";
import { exportMarkdownToPdf } from "@/lib/export-pdf";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Stock {
  symbol: string;
  name: string;
  sector: string;
}

interface PromptTemplates {
  chart_prompt: string;
  report_prompt: string;
  variables: {
    chart_prompt: { name: string; desc: string }[];
    report_prompt: { name: string; desc: string }[];
  };
}

interface AnalysisResult {
  chartConfig: object | null;
  chartTitle: string;
  report: string;
  isLoading: boolean;
  error: string;
}

const FINANCIAL_COLS: { key: string; label: string; unit?: string }[] = [
  { key: "quarter", label: "季度" },
  { key: "revenue_100m", label: "营收", unit: "亿" },
  { key: "revenue_yoy_pct", label: "营收增速", unit: "%" },
  { key: "net_profit_100m", label: "净利润", unit: "亿" },
  { key: "net_profit_yoy_pct", label: "净利增速", unit: "%" },
  { key: "gross_margin_pct", label: "毛利率", unit: "%" },
  { key: "net_margin_pct", label: "净利率", unit: "%" },
  { key: "roe_annualized_pct", label: "ROE", unit: "%" },
  { key: "eps_yuan", label: "EPS", unit: "元" },
  { key: "pe_ttm", label: "PE(TTM)", unit: "x" },
  { key: "pb_ratio", label: "PB", unit: "x" },
  { key: "debt_ratio_pct", label: "负债率", unit: "%" },
];

const exampleQueries = [
  "分析贵州茅台近三年的营收增长趋势",
  "对比招商银行和工商银行的盈利能力",
  "分析新能源板块宁德时代和比亚迪的表现",
  "哪些股票估值最低，有投资价值？",
  "中国平安的财务健康状况如何？",
  "分析白酒和银行板块的盈利能力对比",
];

const sectorColors: Record<string, string> = {
  白酒: "bg-amber-500/20 text-amber-300",
  新能源: "bg-emerald-500/20 text-emerald-300",
  保险: "bg-blue-500/20 text-blue-300",
  银行: "bg-cyan-500/20 text-cyan-300",
  汽车: "bg-violet-500/20 text-violet-300",
  证券: "bg-orange-500/20 text-orange-300",
  互联网金融: "bg-pink-500/20 text-pink-300",
  食品: "bg-yellow-500/20 text-yellow-300",
  房地产: "bg-red-500/20 text-red-300",
};

export default function Case2Page() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [leftTab, setLeftTab] = useState<"list" | "preview">("list");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 提示词工坊
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTab, setPromptTab] = useState<"chart" | "report">("chart");
  const [defaultTemplates, setDefaultTemplates] = useState<PromptTemplates | null>(null);
  const [chartPrompt, setChartPrompt] = useState("");
  const [reportPrompt, setReportPrompt] = useState("");
  const [promptModified, setPromptModified] = useState(false);

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalysisResult>({
    chartConfig: null,
    chartTitle: "",
    report: "",
    isLoading: false,
    error: "",
  });
  const reportEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(api.case2.stocks)
      .then((r) => r.json())
      .then((d) => setStocks(d.stocks || []))
      .catch(() => {});

    fetch(api.case2.promptTemplates)
      .then((r) => r.json())
      .then((d: PromptTemplates) => {
        setDefaultTemplates(d);
        setChartPrompt(d.chart_prompt);
        setReportPrompt(d.report_prompt);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (result.report) {
      reportEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [result.report]);

  const loadPreview = async (stock: Stock) => {
    setSelectedStock(stock);
    setLeftTab("preview");
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const r = await fetch(api.case2.stockData(stock.symbol, "financial"));
      if (r.ok) {
        const d = await r.json();
        setPreviewData((d.data as Record<string, unknown>[]).slice(-8));
      }
    } catch {
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const resetPrompts = () => {
    if (!defaultTemplates) return;
    setChartPrompt(defaultTemplates.chart_prompt);
    setReportPrompt(defaultTemplates.report_prompt);
    setPromptModified(false);
  };

  const handleChartPromptChange = (v: string) => {
    setChartPrompt(v);
    setPromptModified(
      v !== defaultTemplates?.chart_prompt || reportPrompt !== defaultTemplates?.report_prompt
    );
  };

  const handleReportPromptChange = (v: string) => {
    setReportPrompt(v);
    setPromptModified(
      chartPrompt !== defaultTemplates?.chart_prompt || v !== defaultTemplates?.report_prompt
    );
  };

  const handleAnalyze = async () => {
    if (!query.trim() || result.isLoading) return;
    setResult({ chartConfig: null, chartTitle: "", report: "", isLoading: true, error: "" });

    const customPrompts = promptModified
      ? { chart_prompt: chartPrompt, report_prompt: reportPrompt }
      : undefined;

    try {
      await streamFetch(
        api.case2.analyze,
        { query, custom_prompts: customPrompts },
        (data: Record<string, unknown>) => {
          if (data.type === "chart") {
            const chartData = data.data as Record<string, unknown>;
            setResult((prev) => ({
              ...prev,
              chartConfig: (chartData.chart_config as object) || null,
              chartTitle: (chartData.chart_title as string) || "分析图表",
            }));
          } else if (data.type === "report_token") {
            setResult((prev) => ({
              ...prev,
              report: prev.report + (data.token as string),
            }));
          }
        },
        () => {
          setResult((prev) => ({ ...prev, isLoading: false }));
        },
      );
    } catch (err) {
      setResult((prev) => ({
        ...prev,
        isLoading: false,
        error: `分析失败：${err}`,
      }));
    }
  };

  const formatVal = (val: unknown, unit?: string) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    const formatted = Math.abs(num) >= 100 ? num.toFixed(1) : num.toFixed(2);
    return unit ? `${formatted}${unit}` : formatted;
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* 顶部导航 */}
      <div className="h-14 border-b border-gray-800 flex items-center px-6 gap-4 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />返回首页
        </Link>
        <div className="w-px h-5 bg-gray-700" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center">
            <BarChart3 size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">金融数据分析实战</span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">NL→洞察</span>
        </div>
        {promptModified && (
          <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs flex items-center gap-1">
            <Code2 size={10} />已使用自定义提示词
          </span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* ── 左侧面板 ── */}
          <div className="col-span-3 space-y-4">
            {/* Tab 切换 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex border-b border-gray-800">
                <button
                  onClick={() => setLeftTab("list")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                    leftTab === "list" ? "text-emerald-400 bg-emerald-500/5" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Database size={12} />数据集
                </button>
                <button
                  onClick={() => selectedStock ? setLeftTab("preview") : undefined}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                    leftTab === "preview" ? "text-emerald-400 bg-emerald-500/5" :
                    selectedStock ? "text-gray-500 hover:text-gray-300" : "text-gray-700 cursor-not-allowed"
                  }`}
                >
                  <Table2 size={12} />
                  {selectedStock ? `${selectedStock.name}` : "数据预览"}
                </button>
              </div>

              {/* 股票列表 */}
              {leftTab === "list" && (
                <div className="p-4">
                  <div className="space-y-1.5">
                    {stocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        onClick={() => loadPreview(stock)}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer group border ${
                          selectedStock?.symbol === stock.symbol
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "hover:bg-gray-800/50 border-transparent"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-medium text-white group-hover:text-emerald-300 transition-colors">
                            {stock.name}
                          </p>
                          <p className="text-xs text-gray-600">{stock.symbol}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${sectorColors[stock.sector] || "bg-gray-700 text-gray-400"}`}>
                            {stock.sector}
                          </span>
                          <Eye size={10} className="text-gray-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-600 mb-2">数据说明</p>
                    <ul className="space-y-1 text-xs text-gray-500">
                      <li>• 股价：近 3 年日 K 线数据</li>
                      <li>• 财务：8 季度季报数据</li>
                      <li>• 含：营收 / 利润 / PE / PB / ROE</li>
                      <li className="text-yellow-600">⚠ 模拟数据，仅供教学</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-2">点击股票可预览数据</p>
                  </div>
                </div>
              )}

              {/* 数据预览 */}
              {leftTab === "preview" && (
                <div className="p-3">
                  {previewLoading && (
                    <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                      <Loader2 size={16} className="animate-spin text-emerald-400" />
                      <span className="text-xs">加载数据...</span>
                    </div>
                  )}
                  {!previewLoading && previewData && previewData.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-6">暂无数据</p>
                  )}
                  {!previewLoading && previewData && previewData.length > 0 && (
                    <div className="space-y-2">
                      {FINANCIAL_COLS.filter(c => c.key !== "quarter").map((col) => (
                        <div key={col.key} className="bg-gray-800/60 rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-500 mb-1">{col.label}</p>
                          <div className="flex gap-1 flex-wrap">
                            {previewData.slice(-4).map((row, i) => {
                              const val = row[col.key];
                              const num = Number(val);
                              return (
                                <div key={i} className="flex-1 text-center">
                                  <p className="text-xs font-mono text-white">{formatVal(val, col.unit)}</p>
                                  <p className="text-xs text-gray-600">{String(row["quarter"] || "").slice(-2)}</p>
                                  {col.unit === "%" && !isNaN(num) && (
                                    <div className={`mt-0.5 h-0.5 rounded-full ${num >= 0 ? "bg-emerald-400" : "bg-red-400"}`}
                                      style={{ width: `${Math.min(Math.abs(num), 100)}%`, maxWidth: "100%" }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setLeftTab("list")}
                        className="w-full text-xs text-gray-600 hover:text-gray-400 py-1 transition-colors"
                      >
                        ← 返回列表
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── 右侧：分析区域 ── */}
          <div className="col-span-9 space-y-4">

            {/* ── 提示词工坊（可折叠）── */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setPromptOpen(!promptOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Code2 size={14} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">提示词工坊</span>
                  <span className="text-xs text-gray-500">— 查看 / 编辑发送给 AI 的提示词</span>
                  {promptModified && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">已修改</span>
                  )}
                </div>
                {promptOpen ? (
                  <ChevronUp size={16} className="text-gray-500" />
                ) : (
                  <ChevronDown size={16} className="text-gray-500" />
                )}
              </button>

              {promptOpen && (
                <div className="border-t border-gray-800 p-5">
                  {/* 技术说明 */}
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-xs text-blue-300 font-medium mb-1">工作原理</p>
                    <p className="text-xs text-gray-400">
                      每次分析分为两步：<strong className="text-white">Step 1</strong> 让 AI 理解问题并生成图表数据（JSON 输出），
                      <strong className="text-white">Step 2</strong> 让 AI 基于图表数据撰写分析报告（流式文本）。
                      修改提示词可以改变 AI 的输出风格、分析视角和报告结构。
                    </p>
                  </div>

                  {/* Tab 切换 */}
                  <div className="flex gap-2 mb-3">
                    {(["chart", "report"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setPromptTab(t)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          promptTab === t
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {t === "chart" ? "Step 1：图表生成提示词" : "Step 2：分析报告提示词"}
                      </button>
                    ))}
                    <button
                      onClick={resetPrompts}
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <RotateCcw size={11} />重置默认
                    </button>
                  </div>

                  {/* 变量说明 */}
                  {defaultTemplates && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs text-gray-600">变量占位符：</span>
                      {(promptTab === "chart"
                        ? defaultTemplates.variables.chart_prompt
                        : defaultTemplates.variables.report_prompt
                      ).map((v) => (
                        <span key={v.name} className="group relative">
                          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-xs font-mono cursor-help border border-emerald-500/20">
                            {"{" + v.name + "}"}
                          </span>
                          <span className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                            {v.desc}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 编辑区 */}
                  {promptTab === "chart" ? (
                    <textarea
                      value={chartPrompt}
                      onChange={(e) => handleChartPromptChange(e.target.value)}
                      rows={10}
                      className="w-full bg-gray-800/60 border border-gray-700 focus:border-amber-500/60 rounded-xl px-4 py-3 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none resize-none"
                    />
                  ) : (
                    <textarea
                      value={reportPrompt}
                      onChange={(e) => handleReportPromptChange(e.target.value)}
                      rows={10}
                      className="w-full bg-gray-800/60 border border-gray-700 focus:border-amber-500/60 rounded-xl px-4 py-3 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none resize-none"
                    />
                  )}
                  <p className="text-xs text-gray-600 mt-2">
                    提示：修改提示词后点击「分析」，AI 将按照新的提示词生成结果，对比不同提示词效果
                  </p>
                </div>
              )}
            </div>

            {/* ── 查询框 ── */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">自然语言分析</h3>
              </div>
              <div className="flex gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="用自然语言描述你想分析的内容，例如：分析贵州茅台近年的盈利趋势"
                  className="flex-1 bg-gray-800/60 border border-gray-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!query.trim() || result.isLoading}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 text-sm font-medium text-white transition-colors"
                >
                  {result.isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  分析
                </button>
              </div>

              {/* 示例查询 */}
              <div className="mt-3 flex flex-wrap gap-2">
                {exampleQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500/40 rounded-full text-xs text-gray-400 hover:text-white transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* 加载状态 */}
            {result.isLoading && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Loader2 size={22} className="text-emerald-400 animate-spin" />
                </div>
                <p className="text-sm text-gray-400">
                  {result.chartConfig ? "图表已生成，正在撰写分析报告..." : "Step 1：AI 正在解析查询并生成图表..."}
                </p>
                {result.chartConfig && (
                  <p className="text-xs text-gray-600">Step 2：流式生成分析报告中</p>
                )}
              </div>
            )}

            {/* 错误提示 */}
            {result.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{result.error}</p>
              </div>
            )}

            {/* 图表 */}
            {result.chartConfig && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">{result.chartTitle}</h3>
                  {promptModified && (
                    <span className="ml-auto text-xs text-amber-500/70">使用自定义提示词生成</span>
                  )}
                </div>
                <ReactECharts
                  option={{
                    backgroundColor: "transparent",
                    ...(result.chartConfig as object),
                    textStyle: { color: "#9ca3af" },
                  }}
                  style={{ height: 360 }}
                  theme="dark"
                  opts={{ renderer: "canvas" }}
                />
              </div>
            )}

            {/* 分析报告 */}
            {(result.report || (result.isLoading && result.chartConfig)) && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileBarChart size={14} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">AI 分析报告</h3>
                  {result.isLoading && (
                    <span className="inline-block w-1 h-4 bg-emerald-400 cursor-blink ml-1 align-text-bottom" />
                  )}
                  {!result.isLoading && result.report && (
                    <button
                      onClick={() => exportMarkdownToPdf(result.report, "金融数据分析报告")}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 rounded-lg text-xs text-white transition-colors"
                    >
                      <FileDown size={12} />导出 PDF
                    </button>
                  )}
                </div>
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.report || " "}
                  </ReactMarkdown>
                </div>
                <div ref={reportEndRef} />
              </div>
            )}

            {/* 空状态 */}
            {!result.isLoading && !result.chartConfig && !result.error && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-16 text-center">
                <BarChart3 size={40} className="mx-auto mb-4 text-gray-700" />
                <p className="text-gray-500 text-sm">输入查询内容，AI 将自动生成图表和分析报告</p>
                <p className="text-gray-700 text-xs mt-1">
                  支持趋势分析、对比分析、分布分析等多种类型
                </p>
                <p className="text-gray-700 text-xs mt-1">
                  展开「提示词工坊」可自定义 AI 的分析角度
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
