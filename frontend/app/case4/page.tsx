"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  Wand2,
  Star,
  TrendingUp,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

const PLATFORMS = [
  { key: "xiaohongshu", name: "小红书", color: "from-rose-500 to-pink-500", tag: "bg-rose-500/20 text-rose-300", desc: "种草·口碑·真实体验" },
  { key: "zhihu", name: "知乎", color: "from-blue-500 to-indigo-500", tag: "bg-blue-500/20 text-blue-300", desc: "专业·深度·逻辑清晰" },
  { key: "douyin", name: "抖音", color: "from-purple-500 to-violet-500", tag: "bg-purple-500/20 text-purple-300", desc: "快节奏·促单·高转化" },
];

const SAMPLE_PRODUCTS = [
  { name: "轻薄防晒衣 UPF50+", points: "冰感降温、隔热防晒、超轻90g、可水洗", audience: "喜欢户外活动的年轻女性" },
  { name: "玻尿酸补水精华", points: "三重玻尿酸、深层补水、温和无刺激、孕妇可用", audience: "追求精致护肤的25-35岁女性" },
  { name: "无线降噪耳机", points: "40dB主动降噪、30小时续航、快充2小时、轻量230g", audience: "经常通勤/居家办公的上班族" },
];

interface CopyVariant {
  platform: string;
  platform_name: string;
  platform_style: string;
  variant: number;
  copy_text: string;
  scores: {
    title_score: number;
    relevance_score: number;
    action_score: number;
    ctr_score: number;
    suggestion: string;
  };
}

export default function Case4Page() {
  const [productName, setProductName] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["xiaohongshu", "zhihu", "douyin"]);
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ platform: string; variant: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("xiaohongshu");

  const togglePlatform = (key: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const loadSample = (sample: typeof SAMPLE_PRODUCTS[0]) => {
    setProductName(sample.name);
    setSellingPoints(sample.points);
    setTargetAudience(sample.audience);
  };

  const handleGenerate = async () => {
    if (!productName.trim() || selectedPlatforms.length === 0) return;
    setGenerating(true);
    setVariants([]);
    setProgress(null);

    try {
      await streamFetch(
        api.case4.generate,
        {
          product_name: productName,
          selling_points: sellingPoints,
          target_audience: targetAudience,
          platforms: selectedPlatforms,
          extra_info: extraInfo,
          variants_per_platform: 2,
        },
        (data) => {
          if (data.type === "generating") {
            setProgress({ platform: data.platform_name as string, variant: data.variant as number });
          } else if (data.type === "variant") {
            setVariants((prev) => [...prev, data as unknown as CopyVariant]);
            setActiveTab(data.platform as string);
          } else if (data.type === "done") {
            setProgress(null);
          }
        }
      );
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 65) return "text-amber-400";
    return "text-red-400";
  };

  const platformVariants = (platformKey: string) =>
    variants.filter((v) => v.platform === platformKey);

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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Wand2 size={14} className="text-white" />
          </div>
          <span className="font-semibold">智能营销文案创意工坊</span>
          <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full">案例 04</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* 左侧输入面板 */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* 产品信息 */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-orange-400" />
              产品信息
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">产品名称 *</label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="如：轻薄防晒衣 UPF50+"
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">核心卖点</label>
                <textarea
                  value={sellingPoints}
                  onChange={(e) => setSellingPoints(e.target.value)}
                  placeholder="如：冰感降温、超轻90g、UPF50+防晒..."
                  rows={3}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">目标人群</label>
                <input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="如：户外运动爱好者"
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">附加信息（可选）</label>
                <input
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  placeholder="如：限时5折、买一送一..."
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60"
                />
              </div>
            </div>

            {/* 快速填入 */}
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">快速填入示例</p>
              <div className="flex flex-col gap-1.5">
                {SAMPLE_PRODUCTS.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => loadSample(s)}
                    className="text-left text-xs text-gray-400 hover:text-orange-300 hover:bg-orange-500/5 rounded px-2 py-1 transition-colors"
                  >
                    → {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 平台选择 */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">投放平台</h3>
            <div className="space-y-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 border transition-all ${
                    selectedPlatforms.includes(p.key)
                      ? "border-orange-500/40 bg-orange-500/10"
                      : "border-gray-700 bg-gray-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${p.color}`} />
                    <span className="text-sm text-white">{p.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={generating || !productName.trim() || selectedPlatforms.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {progress ? `生成${progress.platform}第${progress.variant}版...` : "生成中..."}
              </>
            ) : (
              <>
                <Wand2 size={16} />
                AI 批量生成文案
              </>
            )}
          </button>
          {variants.length > 0 && (
            <button
              onClick={() => { setVariants([]); setActiveTab("xiaohongshu"); }}
              className="w-full py-2 rounded-xl border border-gray-700 text-gray-400 text-sm flex items-center justify-center gap-2 hover:text-white hover:border-gray-600 transition-colors"
            >
              <RotateCcw size={14} />
              清空重新生成
            </button>
          )}
        </div>

        {/* 右侧结果区 */}
        <div className="flex-1 min-w-0">
          {variants.length === 0 && !generating ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                  <Wand2 size={28} className="text-orange-400" />
                </div>
                <p className="text-gray-400 text-sm">填写产品信息，点击「AI 批量生成文案」</p>
                <p className="text-gray-600 text-xs mt-1">将为每个平台生成 2 个风格版本 + CTR预估评分</p>
              </div>
            </div>
          ) : (
            <div>
              {/* 平台 Tab */}
              <div className="flex gap-2 mb-5">
                {PLATFORMS.filter((p) => selectedPlatforms.includes(p.key)).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setActiveTab(p.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === p.key
                        ? `bg-gradient-to-r ${p.color} text-white shadow-lg`
                        : "bg-gray-800/60 text-gray-400 hover:text-white border border-gray-700"
                    }`}
                  >
                    {p.name}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === p.key ? "bg-white/20" : "bg-gray-700"
                    }`}>
                      {platformVariants(p.key).length}/2
                    </span>
                  </button>
                ))}
              </div>

              {/* 文案卡片网格 */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {generating && platformVariants(activeTab).length === 0 && (
                  <div className="col-span-2 h-48 flex items-center justify-center border border-dashed border-gray-700 rounded-xl">
                    <div className="text-center">
                      <Loader2 size={24} className="text-orange-400 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        {progress ? `正在生成 ${progress.platform} 第${progress.variant}版...` : "AI 生成中..."}
                      </p>
                    </div>
                  </div>
                )}

                {platformVariants(activeTab).map((v, idx) => {
                  const cardId = `${v.platform}-${v.variant}`;
                  const platform = PLATFORMS.find((p) => p.key === v.platform)!;
                  return (
                    <div key={cardId} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col">
                      {/* 卡片头部 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${platform?.tag}`}>
                            {v.platform_name}
                          </span>
                          <span className="text-xs text-gray-500">版本 {v.variant}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(v.copy_text, cardId)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
                        >
                          {copiedId === cardId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          {copiedId === cardId ? "已复制" : "复制"}
                        </button>
                      </div>

                      {/* 文案内容 */}
                      <div className="flex-1 bg-gray-800/40 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{v.copy_text}</p>
                      </div>

                      {/* 评分 */}
                      {v.scores && (
                        <div>
                          <div className="grid grid-cols-4 gap-2 mb-2">
                            {[
                              { label: "标题吸引", score: v.scores.title_score },
                              { label: "内容相关", score: v.scores.relevance_score },
                              { label: "行动引导", score: v.scores.action_score },
                              { label: "CTR预估", score: v.scores.ctr_score },
                            ].map((s) => (
                              <div key={s.label} className="text-center bg-gray-800/60 rounded-lg py-2">
                                <div className={`text-lg font-bold ${getScoreColor(s.score)}`}>{s.score}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                              </div>
                            ))}
                          </div>
                          {v.scores.suggestion && (
                            <div className="flex items-start gap-1.5 text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-2">
                              <TrendingUp size={10} className="flex-shrink-0 mt-0.5" />
                              <span>{v.scores.suggestion}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 生成进度占位 */}
                {generating && platformVariants(activeTab).length === 1 && (
                  <div className="h-64 flex items-center justify-center border border-dashed border-gray-700 rounded-xl">
                    <div className="text-center">
                      <Loader2 size={20} className="text-orange-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-gray-500">生成第 2 版...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 统计信息 */}
              {!generating && variants.length > 0 && (
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-amber-400" />
                    <span>已生成 {variants.length} 个版本</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-400" />
                    <span>
                      最高CTR预估：
                      {Math.max(...variants.filter(v => v.scores).map(v => v.scores?.ctr_score || 0))} 分
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
