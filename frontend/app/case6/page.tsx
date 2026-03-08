"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Loader2,
  ShoppingBag,
  Star,
  Sparkles,
  ChevronRight,
  User,
  BarChart2,
  RefreshCw,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  segment: string;
  avg_order: number;
  purchase_freq: number;
  top_categories: string[];
  style_pref: string;
  price_sensitivity: string;
  review_keywords: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  original_price: number;
  rating: number;
  sales: number;
  selling_points: string;
  review_keywords: string[];
}

interface Segment {
  label: string;
  count: number;
  avg_order: number;
  color: string;
  sample_users: string[];
  top_categories: string[];
  price_sensitivity: string;
}

interface RecommendItem {
  product_id: string;
  product_name: string;
  no_ai_reason: string;
  ai_reason: string;
  product: Product;
}

const PRICE_COLOR: Record<string, string> = {
  高: "text-amber-400 bg-amber-500/10",
  中: "text-blue-400 bg-blue-500/10",
  低: "text-emerald-400 bg-emerald-500/10",
};

export default function Case6Page() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, productsRes, segmentsRes] = await Promise.all([
          fetch(api.case6.users).then((r) => r.json()),
          fetch(api.case6.products).then((r) => r.json()),
          fetch(api.case6.segments).then((r) => r.json()),
        ]);
        setUsers(usersRes.users || []);
        setProducts(productsRes.products || []);
        setSegments(segmentsRes.segments || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInit(false);
      }
    };
    loadData();
  }, []);

  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    setRecommendations([]);
    setGenerating(true);

    try {
      await streamFetch(
        api.case6.recommend,
        { user_id: user.id, product_ids: products.slice(0, 4).map((p) => p.id) },
        (data) => {
          if (data.type === "item") {
            setRecommendations((prev) => [...prev, data as unknown as RecommendItem]);
          }
        }
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 size={24} className="text-teal-400 animate-spin" />
      </div>
    );
  }

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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Users size={14} className="text-white" />
          </div>
          <span className="font-semibold">智能推荐与用户分层平台</span>
          <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full">案例 06</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-5">
        {/* 左侧：用户分层 + 用户列表 */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* 用户分层 */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={14} className="text-teal-400" />
              <h3 className="text-sm font-semibold text-white">用户分层概览</h3>
            </div>
            <div className="space-y-2">
              {segments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2.5 p-2 bg-gray-800/40 rounded-lg">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white font-medium">{seg.label}</span>
                      <span className="text-xs text-gray-500">{seg.count}人</span>
                    </div>
                    <div className="text-xs text-gray-500">均消费 ¥{seg.avg_order}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 用户列表 */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <User size={14} className="text-teal-400" />
              选择用户查看推荐
            </h3>
            <div className="space-y-2">
              {users.map((user) => {
                const seg = segments.find((s) => s.label === user.segment);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                      selectedUser?.id === user.id
                        ? "border-teal-500/50 bg-teal-500/10"
                        : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: seg?.color || "#6b7280" }}
                      >
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="text-sm text-white">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.segment} · {user.city}</div>
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-gray-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：用户画像 + 推荐结果 */}
        <div className="flex-1 min-w-0">
          {selectedUser ? (
            <>
              {/* 用户画像卡片 */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 mb-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{
                      backgroundColor: segments.find((s) => s.label === selectedUser.segment)?.color || "#6b7280",
                    }}
                  >
                    {selectedUser.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-white">{selectedUser.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                        style={{
                          backgroundColor: (segments.find((s) => s.label === selectedUser.segment)?.color || "#6b7280") + "40",
                          color: segments.find((s) => s.label === selectedUser.segment)?.color || "#9ca3af",
                        }}
                      >
                        {selectedUser.segment}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{selectedUser.age}岁 · {selectedUser.gender} · {selectedUser.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">¥{selectedUser.avg_order}</div>
                    <div className="text-xs text-gray-500">平均客单价</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {/* 消费偏好标签 */}
                  <div className="bg-gray-800/40 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">偏好品类</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.top_categories.map((c) => (
                        <span key={c} className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                  {/* 价格敏感度 */}
                  <div className="bg-gray-800/40 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">消费特征</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">价格敏感度</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${PRICE_COLOR[selectedUser.price_sensitivity]}`}>
                          {selectedUser.price_sensitivity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">购买频率</span>
                        <span className="text-white">{selectedUser.purchase_freq}次/月</span>
                      </div>
                    </div>
                  </div>
                  {/* 语义标签 */}
                  <div className="bg-gray-800/40 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">评论语义标签</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.review_keywords.map((k) => (
                        <span key={k} className="text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded">{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 推荐结果对比 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShoppingBag size={14} className="text-teal-400" />
                    个性化推荐对比（无AI vs 有AI）
                  </h3>
                  {generating && (
                    <div className="flex items-center gap-2 text-sm text-teal-400">
                      <Loader2 size={14} className="animate-spin" />
                      AI 生成推荐理由中...
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.product_id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{rec.product_name}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">{rec.product.category}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>¥{rec.product.price}</span>
                            <span className="flex items-center gap-0.5">
                              <Star size={10} className="text-amber-400 fill-amber-400" />
                              {rec.product.rating}%好评
                            </span>
                            <span>{rec.product.sales.toLocaleString()}已售</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="w-4 h-4 rounded bg-gray-600 flex items-center justify-center">
                              <span className="text-xs text-gray-400">规</span>
                            </div>
                            <span className="text-xs text-gray-400">无AI推荐理由</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{rec.no_ai_reason}</p>
                        </div>
                        <div className="bg-teal-500/5 rounded-lg p-3 border border-teal-500/30">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles size={12} className="text-teal-400" />
                            <span className="text-xs text-teal-400">AI个性化推荐理由</span>
                          </div>
                          {rec.ai_reason ? (
                            <p className="text-xs text-teal-200 leading-relaxed">{rec.ai_reason}</p>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Loader2 size={10} className="animate-spin" />
                              生成中...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 生成中占位 */}
                  {generating && recommendations.length < 4 &&
                    Array.from({ length: 4 - recommendations.length }).map((_, i) => (
                      <div key={i} className="bg-gray-900/40 border border-dashed border-gray-800 rounded-xl p-4 flex items-center justify-center h-24">
                        <Loader2 size={16} className="text-teal-500/40 animate-spin" />
                      </div>
                    ))}
                </div>

                {!generating && recommendations.length > 0 && (
                  <button
                    onClick={() => handleSelectUser(selectedUser)}
                    className="mt-3 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <RefreshCw size={12} />
                    重新生成推荐
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-teal-400" />
                </div>
                <p className="text-gray-400 text-sm">从左侧选择一个用户</p>
                <p className="text-gray-600 text-xs mt-1">查看 AI 个性化推荐 vs 规则推荐 的对比效果</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
