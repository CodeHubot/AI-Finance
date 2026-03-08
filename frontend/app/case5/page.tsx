"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Radio,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  BarChart2,
  Play,
  CheckCircle,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface SentimentResult {
  sentiment_stats: { positive: number; negative: number; neutral: number };
  topics: Array<{ name: string; count: number; sentiment: string; representative: string }>;
  negative_issues: Array<{ category: string; proportion: number; severity: string; action: string }>;
  daily_trend: Array<{ date: string; positive: number; negative: number; neutral: number }>;
  overall_score: number;
  key_insight: string;
  alert: { triggered: boolean; reason: string };
}

const SEVERITY_COLOR: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const SEVERITY_LABEL: Record<string, string> = { high: "高危", medium: "中等", low: "低危" };

export default function Case5Page() {
  const [sampleCount, setSampleCount] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(api.case5.sampleData)
      .then((r) => r.json())
      .then((d) => setSampleCount(d.total))
      .catch(() => setSampleCount(200));
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setResult(null);
    setError("");
    setProgress("初始化中...");
    setProgressPct(0);

    try {
      await streamFetch(
        api.case5.analyze,
        { brand_name: "示例品牌", use_sample: true },
        (data) => {
          if (data.type === "progress") {
            setProgress(data.step as string);
            setProgressPct(data.percent as number);
          } else if (data.type === "done") {
            setResult(data.data as SentimentResult);
            setProgressPct(100);
          }
        }
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "分析失败，请重试");
    } finally {
      setAnalyzing(false);
    }
  };

  const sentimentPieOption = result
    ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "item", formatter: "{b}: {c}%" },
        legend: { bottom: 0, textStyle: { color: "#9ca3af", fontSize: 12 } },
        series: [
          {
            type: "pie",
            radius: ["40%", "65%"],
            center: ["50%", "45%"],
            data: [
              { name: "正面", value: result.sentiment_stats.positive, itemStyle: { color: "#10b981" } },
              { name: "负面", value: result.sentiment_stats.negative, itemStyle: { color: "#ef4444" } },
              { name: "中性", value: result.sentiment_stats.neutral, itemStyle: { color: "#6b7280" } },
            ],
            label: { color: "#e5e7eb", fontSize: 12 },
          },
        ],
      }
    : null;

  const trendOption = result
    ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
        legend: { top: 0, textStyle: { color: "#9ca3af", fontSize: 11 } },
        grid: { left: 30, right: 20, bottom: 30, top: 35, containLabel: true },
        xAxis: {
          type: "category",
          data: result.daily_trend.map((d) => d.date),
          axisLabel: { color: "#6b7280", fontSize: 11 },
          axisLine: { lineStyle: { color: "#374151" } },
        },
        yAxis: {
          type: "value",
          max: 100,
          axisLabel: { color: "#6b7280", fontSize: 11, formatter: "{value}%" },
          splitLine: { lineStyle: { color: "#1f2937" } },
        },
        series: [
          {
            name: "正面",
            type: "line",
            data: result.daily_trend.map((d) => d.positive),
            smooth: true,
            itemStyle: { color: "#10b981" },
            areaStyle: { color: "rgba(16,185,129,0.1)" },
            markPoint: {
              data: result.alert.triggered
                ? [{ type: "min", name: "预警低点", label: { color: "#ef4444" }, itemStyle: { color: "#ef4444" } }]
                : [],
            },
          },
          {
            name: "负面",
            type: "line",
            data: result.daily_trend.map((d) => d.negative),
            smooth: true,
            itemStyle: { color: "#ef4444" },
            areaStyle: { color: "rgba(239,68,68,0.1)" },
          },
          {
            name: "中性",
            type: "line",
            data: result.daily_trend.map((d) => d.neutral),
            smooth: true,
            itemStyle: { color: "#6b7280" },
          },
        ],
      }
    : null;

  const topicsOption = result
    ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "item", formatter: "{b}: {c}条" },
        series: [
          {
            type: "treemap",
            data: result.topics.map((t) => ({
              name: t.name,
              value: t.count,
              itemStyle: {
                color:
                  t.sentiment === "positive"
                    ? "rgba(16,185,129,0.6)"
                    : t.sentiment === "negative"
                    ? "rgba(239,68,68,0.6)"
                    : "rgba(107,114,128,0.6)",
                borderColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
              },
              label: { color: "#fff", fontSize: 12 },
            })),
            width: "100%",
            height: "100%",
            breadcrumb: { show: false },
          },
        ],
      }
    : null;

  const issueOption = result
    ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { left: 10, right: 20, bottom: 20, top: 10, containLabel: true },
        xAxis: { type: "value", axisLabel: { color: "#6b7280", fontSize: 11 }, splitLine: { lineStyle: { color: "#1f2937" } } },
        yAxis: {
          type: "category",
          data: result.negative_issues.map((i) => i.category),
          axisLabel: { color: "#9ca3af", fontSize: 11 },
          axisLine: { lineStyle: { color: "#374151" } },
        },
        series: [
          {
            type: "bar",
            data: result.negative_issues.map((i) => ({
              value: i.proportion,
              itemStyle: {
                color: i.severity === "high" ? "#ef4444" : i.severity === "medium" ? "#f59e0b" : "#6366f1",
                borderRadius: [0, 4, 4, 0],
              },
            })),
            label: { show: true, position: "right", formatter: "{c}%", color: "#9ca3af", fontSize: 11 },
          },
        ],
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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
            <Radio size={14} className="text-white" />
          </div>
          <span className="font-semibold">社交媒体舆情洞察大屏</span>
          <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full">案例 05</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 控制栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <MessageSquare size={16} className="text-rose-400" />
              <div>
                <div className="text-xs text-gray-500">内置评论数据集</div>
                <div className="text-sm font-semibold text-white">{sampleCount} 条用户评论</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">涵盖小红书、微博、淘宝评论、抖音等平台</div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {analyzing ? "分析中..." : "开始舆情分析"}
          </button>
        </div>

        {/* 进度条 */}
        {analyzing && (
          <div className="mb-6 bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">{progress}</span>
              <span className="text-sm text-rose-400">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-red-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* 预警横幅 */}
        {result?.alert?.triggered && (
          <div className="mb-5 bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-300 mb-0.5">⚠ 舆情预警触发</div>
              <div className="text-sm text-red-300/80">{result.alert.reason || "检测到负面情绪异常波动，请及时关注"}</div>
            </div>
          </div>
        )}

        {result ? (
          <>
            {/* 顶部指标卡片 */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              {[
                {
                  label: "品牌口碑综合评分",
                  value: result.overall_score,
                  unit: "/ 100",
                  icon: BarChart2,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "正面情感占比",
                  value: result.sentiment_stats.positive + "%",
                  icon: TrendingUp,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "负面情感占比",
                  value: result.sentiment_stats.negative + "%",
                  icon: TrendingDown,
                  color: "text-red-400",
                  bg: "bg-red-500/10",
                },
                {
                  label: "话题聚类数量",
                  value: result.topics.length,
                  unit: "个话题",
                  icon: MessageSquare,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                },
              ].map((m) => (
                <div key={m.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                  <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
                    <m.icon size={16} className={m.color} />
                  </div>
                  <div className={`text-2xl font-bold ${m.color}`}>
                    {m.value}
                    {m.unit && <span className="text-sm font-normal text-gray-500 ml-1">{m.unit}</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* 情感分布饼图 */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">情感分布</h3>
                <ReactECharts option={sentimentPieOption!} style={{ height: 200 }} />
              </div>

              {/* 话题聚类 */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">话题热度聚类</h3>
                <ReactECharts option={topicsOption!} style={{ height: 200 }} />
              </div>

              {/* 负面归因 */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">负面问题归因</h3>
                <ReactECharts option={issueOption!} style={{ height: 200 }} />
              </div>
            </div>

            {/* 趋势图 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">7天情感趋势</h3>
                <ReactECharts option={trendOption!} style={{ height: 180 }} />
              </div>

              {/* 话题列表 */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">热门话题详情</h3>
                <div className="space-y-2 overflow-y-auto max-h-44">
                  {result.topics.map((t) => (
                    <div key={t.name} className="flex items-start gap-2.5 p-2 bg-gray-800/40 rounded-lg">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                          t.sentiment === "positive"
                            ? "bg-emerald-400"
                            : t.sentiment === "negative"
                            ? "bg-red-400"
                            : "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium">{t.name}</span>
                          <span className="text-xs text-gray-500">{t.count} 条</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{t.representative}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 核心洞察 + 改善建议 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">AI 核心洞察</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{result.key_insight}</p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">改善优先级建议</h3>
                <div className="space-y-2">
                  {result.negative_issues.map((issue) => (
                    <div
                      key={issue.category}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border ${SEVERITY_COLOR[issue.severity]}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{SEVERITY_LABEL[issue.severity]}</span>
                        <span className="text-sm">{issue.category}</span>
                      </div>
                      <span className="text-xs opacity-80">{issue.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : !analyzing ? (
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-800 rounded-2xl">
            <div className="text-center">
              <Radio size={32} className="text-rose-500/40 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">点击「开始舆情分析」加载200条模拟用户评论</p>
              <p className="text-gray-600 text-xs mt-1">AI 将自动完成情感分析、话题聚类、趋势检测</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
