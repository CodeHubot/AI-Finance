"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Upload,
  Trash2,
  FileText,
  Send,
  Bot,
  User,
  Settings,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { api, streamFetch } from "@/lib/api";

interface Document {
  id: string;
  filename: string;
  chunk_count: number;
  status: string;
  preview_chunks: { index: number; text: string }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  streaming?: boolean;
}

interface Source {
  filename: string;
  chunk_index: number;
  text: string;
  relevance: number;
}

const DEFAULT_PROMPT = `你是一名专业的金融顾问助手，拥有丰富的金融市场、投资理论和监管政策知识。

你的职责：
1. 基于提供的金融知识库内容准确回答问题
2. 当知识库中没有相关信息时，运用专业金融知识回答
3. 保持客观中立，对于投资建议需注明风险
4. 回答要专业、清晰、有条理

请用中文回答所有问题。`;

export default function Case1Page() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [topK, setTopK] = useState(4);
  const [uploading, setUploading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<"kb" | "settings">("kb");
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(api.case1.documents);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      console.error("加载文档失败");
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(api.case1.upload, { method: "POST", body: formData });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        alert(`上传失败: ${err}`);
      }
    }
    setUploading(false);
    await loadDocuments();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("确认删除该文档？")) return;
    await fetch(api.case1.deleteDoc(docId), { method: "DELETE" });
    await loadDocuments();
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isStreaming) return;

    const userMsg: Message = { role: "user", content: q };
    const assistantMsg: Message = { role: "assistant", content: "", streaming: true, sources: [] };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      await streamFetch(
        api.case1.chat,
        { question: q, system_prompt: systemPrompt, top_k: topK },
        (data: Record<string, unknown>) => {
          if (data.type === "sources") {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                sources: (data.sources as Source[]) || [],
              };
              return next;
            });
          } else if (data.type === "token") {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: next[next.length - 1].content + (data.token as string),
              };
              return next;
            });
          }
        },
        () => {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], streaming: false };
            return next;
          });
          setIsStreaming(false);
        },
      );
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: `请求失败：${err}`,
          streaming: false,
        };
        return next;
      });
      setIsStreaming(false);
    }
  };

  const exampleQuestions = [
    "什么是 RAG 技术？它如何应用于金融场景？",
    "股票市盈率 PE 如何计算？代表什么含义？",
    "基金定投有哪些注意事项？",
    "如何评估一家上市公司的财务健康状况？",
  ];

  return (
    <div className="h-screen bg-[#0a0f1e] flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-4 bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>返回首页</span>
        </Link>
        <div className="w-px h-5 bg-gray-700" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">智能金融问答助手</span>
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
            RAG
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <Database size={12} />
          <span>{documents.length} 篇文档</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧面板：知识库 + 设置 */}
        <div className="w-72 border-r border-gray-800 flex flex-col bg-gray-900/30 flex-shrink-0">
          {/* Tab 切换 */}
          <div className="flex border-b border-gray-800">
            {[
              { key: "kb", label: "知识库", icon: Database },
              { key: "settings", label: "设置", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "kb" | "settings")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "kb" && (
            <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
              {/* 上传区域 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 hover:border-blue-500/60 rounded-xl p-4 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-blue-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-xs">向量化中...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-blue-400 transition-colors">
                    <Upload size={20} />
                    <span className="text-xs">点击上传文档</span>
                    <span className="text-xs opacity-60">PDF / TXT / MD</span>
                  </div>
                )}
              </div>

              {/* 文档列表 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">已索引文档</span>
                <button onClick={loadDocuments} className="text-gray-600 hover:text-gray-400 transition-colors">
                  <RefreshCw size={12} className={loadingDocs ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 text-xs">
                    <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
                    <p>暂无文档</p>
                    <p className="mt-1 opacity-60">上传文档后即可开始问答</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="bg-gray-800/50 rounded-lg overflow-hidden">
                      <div className="flex items-start gap-2 p-2.5">
                        <FileText size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{doc.filename}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle size={10} className="text-emerald-400" />
                            <span className="text-xs text-gray-500">
                              {doc.chunk_count} 个分块
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setExpandedDoc(expandedDoc === doc.id ? null : doc.id)
                            }
                            className="text-gray-600 hover:text-gray-400 transition-colors"
                          >
                            {expandedDoc === doc.id ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {expandedDoc === doc.id && doc.preview_chunks.length > 0 && (
                        <div className="border-t border-gray-700 p-2 space-y-1.5">
                          <p className="text-xs text-gray-500">分块预览：</p>
                          {doc.preview_chunks.map((chunk) => (
                            <div
                              key={chunk.index}
                              className="bg-gray-900/60 rounded p-1.5 text-xs text-gray-400"
                            >
                              <span className="text-gray-600">#{chunk.index + 1} </span>
                              {chunk.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  系统提示词（System Prompt）
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={12}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg p-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 resize-none font-mono"
                />
                <button
                  onClick={() => setSystemPrompt(DEFAULT_PROMPT)}
                  className="mt-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  恢复默认
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  召回文档数量（Top-K = {topK}）
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>精准(1)</span>
                  <span>全面(8)</span>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-400 font-medium mb-1">RAG 流程说明</p>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>用户问题向量化</li>
                  <li>检索 Top-K 相关文档块</li>
                  <li>拼装 Context + 系统提示词</li>
                  <li>LLM 生成回答（流式）</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* 中间：对话区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
                  <Bot size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">智能金融问答助手</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  基于 RAG 技术，从你的金融知识库中检索相关内容，提供精准回答
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-lg">
                  {exampleQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-left p-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 hover:border-blue-500/40 rounded-xl text-xs text-gray-400 hover:text-white transition-all"
                    >
                      <Sparkles size={12} className="text-blue-400 mb-1" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-2xl ${msg.role === "user" ? "order-first" : ""}`}>
                    {msg.role === "user" ? (
                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="markdown-body text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content || " "}
                          </ReactMarkdown>
                          {msg.streaming && (
                            <span className="inline-block w-1 h-4 bg-blue-400 cursor-blink ml-0.5 align-text-bottom" />
                          )}
                        </div>
                      </div>
                    )}
                    {/* 来源引用 */}
                    {msg.role === "assistant" &&
                      !msg.streaming &&
                      msg.sources &&
                      msg.sources.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-600">检索来源：</p>
                          {msg.sources.map((src, si) => (
                            <div
                              key={si}
                              className="bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-blue-400 font-medium">{src.filename}</span>
                                <span className="text-gray-600">
                                  相关度 {(src.relevance * 100).toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-gray-500 line-clamp-2">{src.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-gray-300" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 输入框 */}
          <div className="border-t border-gray-800 p-4 bg-gray-900/30">
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入你的金融问题... (Enter 发送，Shift+Enter 换行)"
                rows={2}
                className="flex-1 bg-gray-800/60 border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
              >
                {isStreaming ? (
                  <Loader2 size={16} className="text-white animate-spin" />
                ) : (
                  <Send size={16} className="text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-700 mt-2 text-center">
              AI 回答仅供参考，不构成投资建议
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
