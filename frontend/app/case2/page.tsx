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
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Stock {
  symbol: string;
  name: string;
  sector: string;
}

interface AnalysisResult {
  chartConfig: object | null;
  chartTitle: string;
  report: string;
  isLoading: boolean;
  error: string;
}

const exampleQueries = [
  "分析贵州茅台近三年的营收增长趋势",
  "对比招商银行和工商银行的盈利能力",
  "分析新能源板块宁德时代和比亚迪的表现",
  "哪些股票估值最低，有投资价值？",
  "中国平安的财务健康状况如何？",
  "分析白酒和银行板块的盈利能力对比",
];

export default function Case2Page() {
  const [stocks, setStocks] = useState<Stock[]>([]);
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
  }, []);

  useEffect(() => {
    if (result.report) {
      reportEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [result.report]);

  const handleAnalyze = async () => {
    if (!query.trim() || result.isLoading) return;

    setResult({ chartConfig: null, chartTitle: "", report: "", isLoading: true, error: "" });

    try {
      await streamFetch(
        api.case2.analyze,
        { query },
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
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：股票列表 */}
          <div className="col-span-3">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Database size={14} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">数据集</h3>
                <span className="ml-auto text-xs text-gray-600">{stocks.length} 支股票</span>
              </div>
              <div className="space-y-1.5">
                {stocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors cursor-default group"
                  >
                    <div>
                      <p className="text-xs font-medium text-white">{stock.name}</p>
                      <p className="text-xs text-gray-600">{stock.symbol}</p>
                    </div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${sectorColors[stock.sector] || "bg-gray-700 text-gray-400"}`}
                    >
                      {stock.sector}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-600 mb-2">数据说明</p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• 股价：近3年日K线数据</li>
                  <li>• 财务：8季度季报数据</li>
                  <li>• 含：营收/利润/PE/PB/ROE</li>
                  <li className="text-yellow-600">⚠ 模拟数据，仅供教学</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 右侧：分析区域 */}
          <div className="col-span-9 space-y-6">
            {/* 查询框 */}
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
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Loader2 size={22} className="text-emerald-400 animate-spin" />
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {result.chartConfig ? "图表已生成，正在分析..." : "AI 正在解析查询意图..."}
                </p>
                {result.chartConfig && (
                  <p className="text-xs text-gray-600">流式生成分析报告中</p>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
