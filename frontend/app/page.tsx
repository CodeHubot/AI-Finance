"use client";
import Link from "next/link";
import {
  Brain, BarChart3, LineChart, ArrowRight, Sparkles, BookOpen, Users,
  Wand2, Radio, Users2, Video, BrainCircuit,
} from "lucide-react";

const FINANCE_CASES = [
  {
    id: 1, href: "/case1", icon: Brain,
    gradient: "from-blue-600 to-cyan-500", bgGlow: "bg-blue-500/10",
    borderColor: "border-blue-500/30 hover:border-blue-400/60", tagColor: "bg-blue-500/20 text-blue-300",
    title: "智能金融问答助手", subtitle: "生成式 AI + RAG 知识库",
    description: "从金融业务需求拆解、场景化提示词设计，到 RAG 金融知识库构建，再到可视化交互原型开发，层层递进完成全流程落地。",
    features: ["PDF/TXT 文档上传与向量化", "提示词工程可视化调试", "RAG 流式对话 + 来源引用"],
    tags: ["RAG", "LangChain", "流式输出"], difficulty: "进阶",
  },
  {
    id: 2, href: "/case2", icon: BarChart3,
    gradient: "from-emerald-600 to-teal-500", bgGlow: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-400/60", tagColor: "bg-emerald-500/20 text-emerald-300",
    title: "金融数据分析实战", subtitle: "自然语言 → 数据洞察",
    description: "掌握金融数据全生命周期处理方法，通过「自然语言提问→AI语义解析→金融数据映射→报告」全链路逻辑实现高效转化。",
    features: ["自然语言驱动的数据查询", "10 支主流 A 股模拟数据", "ECharts 动态图表生成"],
    tags: ["ECharts", "Pandas", "NL2SQL"], difficulty: "基础",
  },
  {
    id: 3, href: "/case3", icon: LineChart,
    gradient: "from-violet-600 to-purple-500", bgGlow: "bg-violet-500/10",
    borderColor: "border-violet-500/30 hover:border-violet-400/60", tagColor: "bg-violet-500/20 text-violet-300",
    title: "投研全流程实践", subtitle: "企业投研辅助平台",
    description: "以企业投研辅助平台为实战载体，覆盖产业链图谱、多源信息聚合、企业评分模型、投研报告生成全流程。",
    features: ["产业链图谱智能梳理", "AI 驱动多维度企业评分", "一键生成标准投研报告"],
    tags: ["投研", "评分模型", "雷达图"], difficulty: "综合",
  },
];

const MARKETING_CASES = [
  {
    id: 4, href: "/case4", icon: Wand2,
    gradient: "from-orange-500 to-amber-500", bgGlow: "bg-orange-500/10",
    borderColor: "border-orange-500/30 hover:border-orange-400/60", tagColor: "bg-orange-500/20 text-orange-300",
    title: "智能营销文案生成", subtitle: "提示工程 + AIGC 创意工坊",
    description: "从多平台风格提示词模板库设计，到 AI 批量生成多版本文案，再到 CTR 点击率预估评分，全流程演示营销内容创作自动化。",
    features: ["多平台风格提示词模板库", "并发批量生成多版本文案", "CTR 点击率预估评分"],
    tags: ["提示工程", "AIGC", "A/B测试"], difficulty: "基础",
  },
  {
    id: 5, href: "/case5", icon: Radio,
    gradient: "from-rose-500 to-red-500", bgGlow: "bg-rose-500/10",
    borderColor: "border-rose-500/30 hover:border-rose-400/60", tagColor: "bg-rose-500/20 text-rose-300",
    title: "社交媒体舆情洞察", subtitle: "情感分析 + 语义聚类大屏",
    description: "基于 200 条模拟社交评论，完整演示批量情感分析、话题语义聚类、负面归因、异常预警到可视化大屏的全链路舆情监控。",
    features: ["批量情感分析（正/负/中性）", "话题语义聚类（Embedding）", "负面预警 + 改善建议"],
    tags: ["情感分析", "语义聚类", "大屏展示"], difficulty: "进阶",
  },
  {
    id: 6, href: "/case6", icon: Users2,
    gradient: "from-teal-500 to-cyan-500", bgGlow: "bg-teal-500/10",
    borderColor: "border-teal-500/30 hover:border-teal-400/60", tagColor: "bg-teal-500/20 text-teal-300",
    title: "智能推荐与用户分层", subtitle: "用户画像 + 个性化推荐平台",
    description: "演示多维用户画像构建、Embedding 用户分层，以及「无AI规则推荐」vs「有AI个性化推荐」的直观效果对比。",
    features: ["消费行为 + 语义标签用户画像", "向量化用户分层（KMeans）", "有AI vs 无AI推荐理由对比"],
    tags: ["Embedding", "用户分层", "个性化推荐"], difficulty: "进阶",
  },
  {
    id: 7, href: "/case7", icon: Video,
    gradient: "from-pink-500 to-fuchsia-500", bgGlow: "bg-pink-500/10",
    borderColor: "border-pink-500/30 hover:border-pink-400/60", tagColor: "bg-pink-500/20 text-pink-300",
    title: "数字人直播导购助手", subtitle: "RAG 知识库 + 实时智能对话",
    description: "搭建直播间数字人智能导购，演示产品知识库构建、RAG 实时检索、多轮对话生成全流程，模拟 7×24 无人直播场景。",
    features: ["产品知识库 RAG 构建", "实时弹幕智能回复（流式）", "知识库命中可视化溯源"],
    tags: ["RAG", "多轮对话", "直播营销"], difficulty: "综合",
  },
  {
    id: 8, href: "/case8", icon: BrainCircuit,
    gradient: "from-indigo-500 to-violet-500", bgGlow: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30 hover:border-indigo-400/60", tagColor: "bg-indigo-500/20 text-indigo-300",
    title: "营销决策智能体", subtitle: "NL2SQL + 思维链推理分析",
    description: "用自然语言提问营销数据，AI 自动完成 NL2SQL 解析、数据可视化、Chain of Thought 逐步推理分析、策略建议生成。",
    features: ["自然语言转 SQL 查询", "思维链（CoT）逐步推理", "AI 策略建议自动生成"],
    tags: ["NL2SQL", "CoT推理", "决策智能体"], difficulty: "综合",
  },
];

const stats = [
  { icon: BookOpen, label: "教学案例", value: "8" },
  { icon: Sparkles, label: "AI 技术栈", value: "15+" },
  { icon: Users, label: "适合学生", value: "全阶段" },
];

function CaseCard({ c }: { c: typeof FINANCE_CASES[0] }) {
  return (
    <Link href={c.href} className="group block">
      <div className={`relative h-full bg-gray-900/60 backdrop-blur-sm border ${c.borderColor} rounded-2xl p-5 transition-all duration-300 overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-36 h-36 ${c.bgGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg`}>
            <c.icon size={20} className="text-white" />
          </div>
          <span className="text-xs text-gray-600 font-mono">案例 {String(c.id).padStart(2, "0")}</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-0.5 group-hover:text-blue-200 transition-colors">{c.title}</h2>
        <p className="text-xs text-gray-500 mb-3">{c.subtitle}</p>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">{c.description}</p>
        <ul className="space-y-1 mb-4">
          {c.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${c.gradient} flex-shrink-0`} />
              {f}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {c.tags.map((tag) => (
            <span key={tag} className={`px-2 py-0.5 ${c.tagColor} rounded-full text-xs`}>{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <span className="text-xs text-gray-500">难度：{c.difficulty}</span>
          <div className="flex items-center gap-1 text-sm text-gray-400 group-hover:text-white transition-colors">
            <span className="text-xs">进入案例</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-600/6 rounded-full blur-3xl" />
        <div className="absolute top-2/3 right-1/3 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* 头部 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
            <Sparkles size={14} />
            <span>AI 教学实验平台 · 金融 × 互联网营销</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            大模型赋能
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent"> 行业应用 </span>
            实战
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            8 大核心场景，覆盖金融与互联网营销双赛道
            <br />
            手把手带你掌握 AI 产品开发全流程
          </p>
          <div className="flex justify-center gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <stat.icon size={16} className="text-blue-400" />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 金融案例组 */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
            <h2 className="text-lg font-bold text-white">金融行业案例</h2>
            <span className="text-xs px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">3 个案例</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FINANCE_CASES.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </div>

        {/* 营销案例组 */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full" />
            <h2 className="text-lg font-bold text-white">互联网营销案例</h2>
            <span className="text-xs px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full">5 个案例</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MARKETING_CASES.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </div>

        {/* 技术架构 */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">平台技术架构</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: "前端框架", value: "Next.js 14", sub: "React + TailwindCSS" },
              { label: "后端框架", value: "FastAPI", sub: "Python + LangChain" },
              { label: "向量数据库", value: "FAISS", sub: "语义检索引擎" },
              { label: "大模型接入", value: "OpenAI / DeepSeek", sub: "可配置切换" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="text-white font-semibold text-sm">{item.value}</div>
                <div className="text-xs text-gray-500 mt-1">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10 text-gray-600 text-sm">
          AI 教学案例平台 · 金融 × 互联网营销 · 仅供教学参考使用
        </div>
      </div>
    </div>
  );
}
