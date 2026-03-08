"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  Loader2,
  Send,
  Bot,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Zap,
  ShoppingCart,
  Package,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number;
  stock: number;
  category: string;
  description: string;
  specs: string;
  promotion: string;
  faq: Array<{ q: string; a: string }>;
}

interface KnowledgeItem {
  product_id: string;
  product_name: string;
  price: number;
  faq_count: number;
  category: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  retrieval?: Array<{ product_name: string; content: string; type: string }>;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "防晒衣防晒效果怎么样？",
  "精华液适合油皮吗？",
  "耳机降噪效果好吗？",
  "现在有什么优惠活动？",
  "多少钱？",
  "可以退换货吗？",
];

export default function Case7Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedKnowledge, setExpandedKnowledge] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(api.case7.products).then((r) => r.json()),
      fetch(api.case7.knowledge).then((r) => r.json()),
    ]).then(([pRes, kRes]) => {
      setProducts(pRes.products || []);
      setKnowledge(kRes.knowledge || []);
      if (pRes.products?.length > 0) setSelectedProductId(pRes.products[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始欢迎消息
  useEffect(() => {
    if (!loading && products.length > 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "👋 欢迎来到星耀好物直播间！我是AI主播小美，今天为您带来超值好物！有什么想了解的欢迎问我～",
        timestamp: new Date(),
      }]);
    }
  }, [loading, products]);

  const handleSend = async (text?: string) => {
    const message = text || inputText.trim();
    if (!message || sending) return;
    setInputText("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    try {
      let retrievalData: ChatMessage["retrieval"] = undefined;
      await streamFetch(
        api.case7.chat,
        { message, current_product_id: selectedProductId },
        (data) => {
          if (data.type === "retrieval") {
            retrievalData = data.chunks as ChatMessage["retrieval"];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, retrieval: retrievalData } : m
              )
            );
          } else if (data.type === "token") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + (data.token as string) }
                  : m
              )
            );
          }
        }
      );
    } finally {
      setSending(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 size={24} className="text-pink-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* 顶部导航 */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">返回首页</span>
        </Link>
        <div className="h-4 w-px bg-gray-700" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center">
            <Video size={14} className="text-white" />
          </div>
          <span className="font-semibold">数字人直播间 · 智能导购助手</span>
          <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-full">案例 07</span>
        </div>
        {/* 直播状态 */}
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-red-300 font-medium">LIVE</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：商品知识库 */}
        <div className="w-64 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-900/30">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen size={14} className="text-pink-400" />
              产品知识库
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">RAG检索范围</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {knowledge.map((k) => (
              <div key={k.product_id} className="bg-gray-800/40 border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedKnowledge(expandedKnowledge === k.product_id ? null : k.product_id)}
                  className="w-full flex items-center justify-between p-2.5 text-left hover:bg-gray-700/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package size={12} className="text-pink-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-white font-medium">{k.product_name}</div>
                      <div className="text-xs text-gray-500">¥{k.price} · {k.faq_count}条FAQ</div>
                    </div>
                  </div>
                  {expandedKnowledge === k.product_id ? (
                    <ChevronUp size={10} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={10} className="text-gray-500" />
                  )}
                </button>
                {expandedKnowledge === k.product_id && (
                  <div className="px-2.5 pb-2.5">
                    {products.find((p) => p.id === k.product_id)?.faq.map((qa, i) => (
                      <div key={i} className="mt-1.5 bg-gray-700/40 rounded p-2">
                        <div className="text-xs text-pink-300 mb-0.5">Q: {qa.q}</div>
                        <div className="text-xs text-gray-400">{qa.a}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 当前商品切换 */}
          <div className="p-3 border-t border-gray-800">
            <div className="text-xs text-gray-500 mb-2">当前介绍商品</div>
            <div className="space-y-1">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    selectedProductId === p.id
                      ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                      : "text-gray-400 hover:bg-gray-700/40"
                  }`}
                >
                  <ShoppingCart size={10} className="flex-shrink-0" />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：直播间 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 当前商品展示 */}
          {selectedProduct && (
            <div className="border-b border-gray-800 px-5 py-3 bg-gradient-to-r from-pink-950/20 to-transparent flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{selectedProduct.name}</span>
                  <span className="text-xs text-pink-300 bg-pink-500/20 px-1.5 py-0.5 rounded">直播中</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{selectedProduct.description}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-pink-300">¥{selectedProduct.price}</div>
                <div className="text-xs text-gray-500 line-through">¥{selectedProduct.original_price}</div>
              </div>
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg flex-shrink-0">
                库存 {selectedProduct.stock} 件
              </div>
            </div>
          )}

          {/* 对话区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-pink-500 to-fuchsia-500"
                      : "bg-gray-700"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot size={14} className="text-white" />
                  ) : (
                    <User size={14} className="text-white" />
                  )}
                </div>
                <div className={`max-w-lg ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {/* 知识库引用 */}
                  {msg.retrieval && msg.retrieval.length > 0 && (
                    <div className="bg-gray-800/40 border border-pink-500/20 rounded-lg px-3 py-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1 mb-1 text-pink-400">
                        <Zap size={10} />
                        知识库命中：{msg.retrieval.map((r) => r.product_name).filter((v, i, a) => a.indexOf(v) === i).join("、")}
                      </div>
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-pink-500/20 text-white border border-pink-500/30"
                        : "bg-gray-800/60 text-gray-200 border border-gray-700"
                    }`}
                  >
                    {msg.content || (
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Loader2 size={12} className="animate-spin" />
                        思考中...
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-gray-800">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={sending}
                className="text-xs px-3 py-1.5 bg-gray-800/60 border border-gray-700 text-gray-300 rounded-full hover:border-pink-500/50 hover:text-pink-300 transition-all disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>

          {/* 输入框 */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mr-1">
                <MessageCircle size={12} className="text-pink-400" />
                弹幕
              </div>
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="发送弹幕，向数字人主播提问..."
                className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/60"
                disabled={sending}
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || !inputText.trim()}
                className="w-10 h-10 bg-gradient-to-br from-pink-500 to-fuchsia-500 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {sending ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
