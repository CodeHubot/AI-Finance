"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  BrainCircuit,
  Loader2,
  Send,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Code2,
  BarChart2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface DashboardData {
  summary: {
    total_revenue: number;
    total_spend: number;
    total_orders: number;
    avg_roi: number;
    best_channel: string;
    worst_channel: string;
  };
  channels: Array<{
    channel: string;
    impressions: number;
    clicks: number;
    spend: number;
    orders: number;
    revenue: number;
    ctr: number;
    roi: number;
  }>;
  daily: Array<{ date: string; revenue: number; orders: number; new_users: number }>;
  anomaly: { date: string; revenue: number; prev_avg: number; drop_pct: number };
}

interface QueryResult {
  nl2sql: { intent: string; sql: string; chart_type: string };
  data: Record<string, unknown>;
  chart: {
    type: string;
    title: string;
    xData?: string[];
    yData?: number[];
    yLabel?: string;
    color?: string[];
    series?: Array<{ name: string; data: number[] }>;
    data?: Array<{ name: string; value: number }>;
  };
  analysis: string;
}

export default function Case8Page() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [exampleQueries, setExampleQueries] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [step, setStep] = useState<string>("");
  const [showSql, setShowSql] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(api.case8.dashboard).then((r) => r.json()),
      fetch(api.case8.exampleQueries).then((r) => r.json()),
    ]).then(([dash, queries]) => {
      setDashboard(dash);
      setExampleQueries(queries.queries || []);
    });
  }, []);

  useEffect(() => {
    if (analysisRef.current) {
      analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
    }
  }, [analysisText]);

  const handleQuery = async (q?: string) => {
    const query = q || question.trim();
    if (!query || querying) return;
    setQuestion(query);
    setQuerying(true);
    setResult(null);
    setAnalysisText("");
    setStep("解析中...");
    setShowSql(false);

    const partialResult: Partial<QueryResult> = {};

    try {
      await streamFetch(
        api.case8.query,
        { question: query },
        (data) => {
          if (data.type === "step") {
            setStep(data.message as string);
          } else if (data.type === "nl2sql") {
            partialResult.nl2sql = data.result as QueryResult["nl2sql"];
            setResult({ ...partialResult } as QueryResult);
          } else if (data.type === "data") {
            partialResult.data = data.data as QueryResult["data"];
            partialResult.chart = data.chart as QueryResult["chart"];
            setResult({ ...partialResult } as QueryResult);
            setStep("AI思维链分析中...");
          } else if (data.type === "token") {
            setAnalysisText((prev) => prev + (data.token as string));
          } else if (data.type === "done") {
            setStep("");
          }
        }
      );
    } finally {
      setQuerying(false);
      setStep("");
    }
  };

  const buildChartOption = (chart: QueryResult["chart"]) => {
    if (!chart) return null;
    const baseStyle = {
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" as const },
      grid: { left: 10, right: 20, bottom: 20, top: 30, containLabel: true },
    };

    if (chart.type === "bar" && chart.xData && chart.yData) {
      return {
        ...baseStyle,
        title: { text: chart.title, textStyle: { color: "#e5e7eb", fontSize: 13 }, top: 0 },
        xAxis: {
          type: "category",
          data: chart.xData,
          axisLabel: { color: "#6b7280", fontSize: 11 },
          axisLine: { lineStyle: { color: "#374151" } },
        },
        yAxis: {
          type: "value",
          name: chart.yLabel,
          axisLabel: { color: "#6b7280", fontSize: 11 },
          splitLine: { lineStyle: { color: "#1f2937" } },
        },
        series: [{
          type: "bar",
          data: chart.yData.map((v, i) => ({
            value: v,
            itemStyle: { color: chart.color?.[i] || "#6366f1", borderRadius: [4, 4, 0, 0] },
          })),
          label: { show: true, position: "top", color: "#9ca3af", fontSize: 11 },
        }],
      };
    }

    if (chart.type === "line" && chart.series) {
      const colors = ["#10b981", "#6366f1", "#f59e0b"];
      return {
        ...baseStyle,
        title: { text: chart.title, textStyle: { color: "#e5e7eb", fontSize: 13 }, top: 0 },
        legend: { top: 0, right: 0, textStyle: { color: "#9ca3af", fontSize: 11 } },
        xAxis: {
          type: "category",
          data: dashboard?.daily.map((d) => d.date) || [],
          axisLabel: { color: "#6b7280", fontSize: 11 },
          axisLine: { lineStyle: { color: "#374151" } },
        },
        yAxis: { type: "value", axisLabel: { color: "#6b7280", fontSize: 11 }, splitLine: { lineStyle: { color: "#1f2937" } } },
        series: chart.series.map((s, i) => ({
          name: s.name,
          type: "line",
          data: s.data,
          smooth: true,
          itemStyle: { color: colors[i] },
          areaStyle: { color: colors[i] + "15" },
        })),
      };
    }

    if (chart.type === "pie" && chart.data) {
      const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
      return {
        backgroundColor: "transparent",
        title: { text: chart.title, textStyle: { color: "#e5e7eb", fontSize: 13 }, top: 0, left: "center" },
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        series: [{
          type: "pie",
          radius: ["35%", "60%"],
          center: ["50%", "55%"],
          data: chart.data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
          label: { color: "#e5e7eb", fontSize: 11 },
        }],
      };
    }

    return null;
  };

  // 主看板图表
  const roiChartOption = dashboard
    ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { left: 10, right: 10, bottom: 20, top: 10, containLabel: true },
        xAxis: {
          type: "category",
          data: dashboard.channels.map((c) => c.channel),
          axisLabel: { color: "#6b7280", fontSize: 10 },
          axisLine: { lineStyle: { color: "#374151" } },
        },
        yAxis: {
          type: "value",
          axisLabel: { color: "#6b7280", fontSize: 10 },
          splitLine: { lineStyle: { color: "#1f2937" } },
        },
        series: [{
          type: "bar",
          data: dashboard.channels.map((c) => ({
            value: c.roi,
            itemStyle: {
              color: c.roi >= 4 ? "#10b981" : c.roi >= 3 ? "#6366f1" : "#ef4444",
              borderRadius: [3, 3, 0, 0],
            },
          })),
          label: { show: true, position: "top", formatter: "{c}x", color: "#9ca3af", fontSize: 10 },
        }],
      }
    : null;

  const revenueChartOption = dashboard
    ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { left: 10, right: 10, bottom: 20, top: 5, containLabel: true },
        xAxis: {
          type: "category",
          data: dashboard.daily.map((d) => d.date),
          axisLabel: { color: "#6b7280", fontSize: 10 },
          axisLine: { lineStyle: { color: "#374151" } },
        },
        yAxis: { type: "value", axisLabel: { color: "#6b7280", fontSize: 10 }, splitLine: { lineStyle: { color: "#1f2937" } } },
        series: [{
          type: "line",
          data: dashboard.daily.map((d, i) => ({
            value: d.revenue,
            itemStyle: { color: i === 4 ? "#ef4444" : "#6366f1" },
            symbol: i === 4 ? "pin" : "circle",
            symbolSize: i === 4 ? 12 : 6,
          })),
          smooth: true,
          itemStyle: { color: "#6366f1" },
          areaStyle: { color: "rgba(99,102,241,0.1)" },
          lineStyle: { color: "#6366f1" },
        }],
        markPoint: {
          data: [{ coord: [4, dashboard.daily[4].revenue], name: "异常", value: "⚠" }],
        },
      }
    : null;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* 顶部导航 */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">返回首页</span>
        </Link>
        <div className="h-4 w-px bg-gray-700" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <BrainCircuit size={14} className="text-white" />
          </div>
          <span className="font-semibold">营销数据分析与决策智能体</span>
          <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full">案例 08</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 自然语言查询框 */}
        <div className="mb-6 bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-sm font-semibold text-white">自然语言查询营销数据</span>
          </div>
          <div className="flex gap-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              placeholder="用中文提问，如「上周哪个渠道ROI最低？」"
              className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 text-sm"
              disabled={querying}
            />
            <button
              onClick={() => handleQuery()}
              disabled={querying || !question.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {querying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {querying ? step || "分析中..." : "查询"}
            </button>
          </div>

          {/* 示例查询 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {exampleQueries.map((q) => (
              <button
                key={q}
                onClick={() => handleQuery(q)}
                disabled={querying}
                className="text-xs px-3 py-1.5 bg-gray-800/60 border border-gray-700 text-gray-300 rounded-full hover:border-indigo-500/50 hover:text-indigo-300 transition-all disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 异常提示 */}
        {dashboard?.anomaly && (
          <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
            <div className="text-sm text-amber-300">
              <span className="font-medium">数据异常：</span>
              {dashboard.anomaly.date} 营收 ¥{dashboard.anomaly.revenue.toLocaleString()}，较前日均值下降 {dashboard.anomaly.drop_pct}%
            </div>
          </div>
        )}

        {/* 查询结果区域 */}
        {result && (
          <div className="mb-6 space-y-4">
            {/* NL2SQL */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowSql(!showSql)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Code2 size={14} className="text-indigo-400" />
                  <span className="font-medium text-white">AI解析结果</span>
                  {result.nl2sql?.intent && (
                    <span className="text-gray-400">—— {result.nl2sql.intent}</span>
                  )}
                </div>
                {showSql ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
              </button>
              {showSql && result.nl2sql?.sql && (
                <div className="px-4 pb-4">
                  <pre className="bg-gray-950/80 border border-gray-700 rounded-lg p-3 text-xs text-emerald-300 overflow-x-auto">
                    {result.nl2sql.sql}
                  </pre>
                </div>
              )}
            </div>

            {/* 图表 */}
            {result.chart && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 size={14} className="text-indigo-400" />
                  <span className="text-sm font-semibold text-white">数据可视化</span>
                </div>
                {buildChartOption(result.chart) && (
                  <ReactECharts option={buildChartOption(result.chart)!} style={{ height: 220 }} />
                )}
              </div>
            )}

            {/* AI分析（CoT流式输出） */}
            {analysisText && (
              <div className="bg-gray-900/60 border border-indigo-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BrainCircuit size={14} className="text-indigo-400" />
                  <span className="text-sm font-semibold text-white">AI 思维链分析</span>
                  {querying && <Loader2 size={12} className="text-indigo-400 animate-spin" />}
                </div>
                <div
                  ref={analysisRef}
                  className="prose prose-sm prose-invert max-w-none max-h-96 overflow-y-auto"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisText}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 营销看板（常驻显示） */}
        {dashboard && (
          <>
            {/* 核心指标 */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              {[
                { label: "本周总营收", value: `¥${(dashboard.summary.total_revenue / 10000).toFixed(1)}万`, icon: DollarSign, color: "text-indigo-400", bg: "bg-indigo-500/10", trend: "+12%" },
                { label: "总投放花费", value: `¥${(dashboard.summary.total_spend / 10000).toFixed(1)}万`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10", trend: "-3%" },
                { label: "总订单量", value: dashboard.summary.total_orders.toLocaleString(), icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-500/10", trend: "+8%" },
                { label: "综合ROI", value: dashboard.summary.avg_roi.toFixed(1) + "x", icon: BarChart2, color: "text-violet-400", bg: "bg-violet-500/10", trend: "+0.3" },
              ].map((m) => (
                <div key={m.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                      <m.icon size={15} className={m.color} />
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      m.trend.startsWith("+") ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                    }`}>
                      {m.trend}
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* 图表看板 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">各渠道 ROI 对比</h3>
                {roiChartOption && <ReactECharts option={roiChartOption} style={{ height: 160 }} />}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block" />ROI≥4（优秀）</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500 inline-block" />ROI 3-4（良好）</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block" />ROI＜3（待优化）</span>
                </div>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">7日营收趋势</h3>
                  <div className="flex items-center gap-1 text-xs text-amber-300">
                    <TrendingDown size={10} />
                    03-05 异常低点
                  </div>
                </div>
                {revenueChartOption && <ReactECharts option={revenueChartOption} style={{ height: 160 }} />}
              </div>
            </div>

            {/* 渠道明细表 */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">渠道投放明细</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      {["渠道", "曝光量", "点击量", "CTR", "花费", "订单数", "营收", "ROI"].map((h) => (
                        <th key={h} className="text-left pb-2 pr-4 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.channels.map((c) => (
                      <tr key={c.channel} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                        <td className="py-2 pr-4 text-white font-medium">{c.channel}</td>
                        <td className="py-2 pr-4 text-gray-400">{c.impressions.toLocaleString()}</td>
                        <td className="py-2 pr-4 text-gray-400">{c.clicks.toLocaleString()}</td>
                        <td className="py-2 pr-4 text-gray-400">{c.ctr}%</td>
                        <td className="py-2 pr-4 text-gray-400">¥{c.spend.toLocaleString()}</td>
                        <td className="py-2 pr-4 text-gray-400">{c.orders}</td>
                        <td className="py-2 pr-4 text-gray-400">¥{c.revenue.toLocaleString()}</td>
                        <td className={`py-2 pr-4 font-medium ${
                          c.roi >= 4 ? "text-emerald-400" : c.roi >= 3 ? "text-indigo-400" : "text-red-400"
                        }`}>
                          {c.roi}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
