"use client";
import Link from "next/link";
import {
  Brain, BarChart3, LineChart, ArrowRight, Sparkles, BookOpen,
  Wand2, Radio, Users2, Video, BrainCircuit,
  PenTool, Map, GraduationCap, MessageSquare,
  Layers, Cpu, Database, Zap, TrendingUp, Users, FlaskConical,
} from "lucide-react";

// ─── 数据定义 ────────────────────────────────────────────────────────────────

const FINANCE_CASES = [
  {
    id: 1, href: "/case1", icon: Brain,
    gradient: "from-blue-600 to-cyan-500", bgGlow: "bg-blue-500/10",
    borderColor: "border-blue-500/30 hover:border-blue-400/60", tagColor: "bg-blue-500/20 text-blue-300",
    title: "智能金融问答助手", subtitle: "RAG 知识库 + 提示词工程",
    description: "从金融业务需求拆解、场景化提示词设计，到 RAG 知识库构建与流式对话，完整演示 LLM 在金融问答场景的落地全流程。",
    features: ["PDF/TXT 文档向量化索引", "提示词工程可视化调试", "流式对话 + 来源引用溯源"],
    tags: ["RAG", "LangChain", "流式输出"], difficulty: "进阶",
  },
  {
    id: 2, href: "/case2", icon: BarChart3,
    gradient: "from-emerald-600 to-teal-500", bgGlow: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-400/60", tagColor: "bg-emerald-500/20 text-emerald-300",
    title: "金融数据分析实战", subtitle: "自然语言 → 数据洞察",
    description: "通过「自然语言提问 → AI 语义解析 → 金融数据映射 → 可视化报告」全链路，掌握金融数据智能分析的核心技术范式。",
    features: ["自然语言驱动数据查询（NL2SQL）", "10 支主流 A 股模拟数据集", "ECharts 动态图表实时生成"],
    tags: ["NL2SQL", "ECharts", "Pandas"], difficulty: "基础",
  },
  {
    id: 3, href: "/case3", icon: LineChart,
    gradient: "from-violet-600 to-purple-500", bgGlow: "bg-violet-500/10",
    borderColor: "border-violet-500/30 hover:border-violet-400/60", tagColor: "bg-violet-500/20 text-violet-300",
    title: "投研全流程实践", subtitle: "产业链图谱 + AI 评分 + 报告生成",
    description: "以企业投研辅助平台为实战载体，覆盖产业链图谱构建、多源信息聚合、AI 驱动评分模型、一键生成投研报告全流程。",
    features: ["产业链图谱智能梳理与可视化", "多维度企业 AI 评分（雷达图）", "结构化投研报告一键生成"],
    tags: ["投研", "评分模型", "Agent"], difficulty: "综合",
  },
];

const MARKETING_CASES = [
  {
    id: 4, href: "/case4", icon: Wand2,
    gradient: "from-orange-500 to-amber-500", bgGlow: "bg-orange-500/10",
    borderColor: "border-orange-500/30 hover:border-orange-400/60", tagColor: "bg-orange-500/20 text-orange-300",
    title: "智能营销文案生成", subtitle: "多平台提示词模板 + AIGC 批量创作",
    description: "设计多平台（小红书/知乎/抖音）风格提示词模板库，AI 批量并发生成多版本文案，并通过 CTR 预估评分指导内容优化。",
    features: ["多平台风格提示词模板库", "并发批量生成多版本文案", "CTR 点击率预估与 A/B 对比"],
    tags: ["提示工程", "AIGC", "A/B测试"], difficulty: "基础",
  },
  {
    id: 5, href: "/case5", icon: Radio,
    gradient: "from-rose-500 to-red-500", bgGlow: "bg-rose-500/10",
    borderColor: "border-rose-500/30 hover:border-rose-400/60", tagColor: "bg-rose-500/20 text-rose-300",
    title: "社交媒体舆情洞察", subtitle: "情感分析 + 语义聚类 + 可视化大屏",
    description: "基于模拟社交评论，完整演示批量情感分析、话题语义聚类、负面归因定位、异常预警到实时可视化大屏的全链路舆情监控。",
    features: ["批量情感三分类（正/负/中性）", "话题语义聚类（Embedding + KMeans）", "负面预警 + 根因归因分析"],
    tags: ["情感分析", "Embedding", "大屏展示"], difficulty: "进阶",
  },
  {
    id: 6, href: "/case6", icon: Users2,
    gradient: "from-teal-500 to-cyan-500", bgGlow: "bg-teal-500/10",
    borderColor: "border-teal-500/30 hover:border-teal-400/60", tagColor: "bg-teal-500/20 text-teal-300",
    title: "智能推荐与用户分层", subtitle: "用户画像 + 向量化分层 + 个性化推荐",
    description: "演示多维用户画像构建、Embedding 向量用户分层，并直观对比「传统规则推荐」与「AI 个性化推荐」的实际效果差异。",
    features: ["行为 + 语义标签多维用户画像", "向量化用户分层（KMeans 聚类）", "AI vs 非AI 推荐理由可视化对比"],
    tags: ["Embedding", "用户分层", "个性化推荐"], difficulty: "进阶",
  },
  {
    id: 7, href: "/case7", icon: Video,
    gradient: "from-pink-500 to-fuchsia-500", bgGlow: "bg-pink-500/10",
    borderColor: "border-pink-500/30 hover:border-pink-400/60", tagColor: "bg-pink-500/20 text-pink-300",
    title: "数字人直播导购助手", subtitle: "产品知识库 RAG + 实时多轮对话",
    description: "搭建直播间数字人智能导购系统，演示产品知识库构建、RAG 实时检索、多轮上下文对话，模拟 7×24 无人直播场景。",
    features: ["产品知识库 RAG 检索构建", "弹幕实时智能回复（流式输出）", "知识库命中可视化溯源"],
    tags: ["RAG", "多轮对话", "直播电商"], difficulty: "综合",
  },
  {
    id: 8, href: "/case8", icon: BrainCircuit,
    gradient: "from-indigo-500 to-violet-500", bgGlow: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30 hover:border-indigo-400/60", tagColor: "bg-indigo-500/20 text-indigo-300",
    title: "营销决策智能体", subtitle: "NL2SQL + 思维链推理 + 策略生成",
    description: "用自然语言提问营销数据，AI 自动完成 NL2SQL 解析、数据可视化、Chain-of-Thought 逐步推理分析，生成可落地的策略建议。",
    features: ["自然语言转 SQL 精准查询", "Chain-of-Thought 逐步推理", "AI 策略建议自动生成"],
    tags: ["NL2SQL", "CoT推理", "决策Agent"], difficulty: "综合",
  },
];

const EDUCATION_CASES = [
  {
    id: 9, href: "/case9", icon: BookOpen,
    gradient: "from-sky-500 to-blue-600", bgGlow: "bg-sky-500/10",
    borderColor: "border-sky-500/30 hover:border-sky-400/60", tagColor: "bg-sky-500/20 text-sky-300",
    title: "智能作业批改系统", subtitle: "多维评分量规 + 个性化反馈",
    description: "将语文作文、数学解答、英语写作等多学科作业提交 AI，自动生成多维度评分、逐条错误批注、亮点识别和个性化改进建议。",
    features: ["多学科评分量规动态生成", "逐条错误标注与纠正建议", "亮点识别 + 个性化改进方向"],
    tags: ["结构化输出", "评分量规", "个性化反馈"], difficulty: "基础",
  },
  {
    id: 10, href: "/case10", icon: Map,
    gradient: "from-emerald-500 to-green-600", bgGlow: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-400/60", tagColor: "bg-emerald-500/20 text-emerald-300",
    title: "个性化学习路径规划", subtitle: "学情诊断 + 知识图谱 + 自适应方案",
    description: "输入学科、当前水平、薄弱模块与目标，AI 自动诊断学情短板、规划分阶段学习计划、绘制知识优先级图谱与每周时间表。",
    features: ["AI 学情诊断与核心短板识别", "分阶段里程碑式学习计划", "知识依赖关系图谱可视化"],
    tags: ["学情分析", "知识图谱", "自适应学习"], difficulty: "进阶",
  },
  {
    id: 11, href: "/case11", icon: PenTool,
    gradient: "from-amber-500 to-orange-600", bgGlow: "bg-amber-500/10",
    borderColor: "border-amber-500/30 hover:border-amber-400/60", tagColor: "bg-amber-500/20 text-amber-300",
    title: "智能教学设计助手", subtitle: "三维目标 + 教学流程 + 差异化策略",
    description: "教师输入学科、年级、课题，AI 自动生成三维教学目标、带设计意图的教学流程、差异化教学策略、练习题与板书设计。",
    features: ["三维教学目标（知/能/情）自动拆解", "环节化教学流程含设计意图说明", "学困生/优等生差异化策略分离"],
    tags: ["教学设计", "差异化教学", "Few-shot"], difficulty: "进阶",
  },
  {
    id: 12, href: "/case12", icon: GraduationCap,
    gradient: "from-purple-500 to-violet-600", bgGlow: "bg-purple-500/10",
    borderColor: "border-purple-500/30 hover:border-purple-400/60", tagColor: "bg-purple-500/20 text-purple-300",
    title: "高校学术研究助手", subtitle: "文献综述规划 + 论文框架 + 写作检查",
    description: "研究生输入研究方向，AI 辅助完成文献领域全景梳理、研究空白识别、论文框架与研究方法设计，并提供学术写作规范检查。",
    features: ["研究空白智能识别与热点分析", "论文章节框架 + 研究时间线", "学术写作规范多维度检查"],
    tags: ["文献综述", "CoT推理", "学术写作"], difficulty: "综合",
  },
  {
    id: 13, href: "/case13", icon: MessageSquare,
    gradient: "from-cyan-500 to-teal-600", bgGlow: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30 hover:border-cyan-400/60", tagColor: "bg-cyan-500/20 text-cyan-300",
    title: "智慧课堂问答系统", subtitle: "苏格拉底提问序列 + 即时回答评析",
    description: "根据学科和知识点，AI 生成布鲁姆认知层次递进的苏格拉底式问题序列、快速检测题、易错陷阱，并即时评析学生回答给出教师反馈。",
    features: ["六层认知递进苏格拉底问题序列", "常见认知误区精准陷阱题库", "学生回答即时 AI 评析 + 反馈示例"],
    tags: ["苏格拉底提问", "布鲁姆分类", "即时反馈"], difficulty: "基础",
  },
];

// 难度徽章
const DIFF_BADGE: Record<string, string> = {
  "基础": "text-emerald-400 bg-emerald-400/10",
  "进阶": "text-amber-400 bg-amber-400/10",
  "综合": "text-rose-400 bg-rose-400/10",
};

// ─── 组件 ────────────────────────────────────────────────────────────────────

function CaseCard({ c }: { c: typeof FINANCE_CASES[0] }) {
  return (
    <Link href={c.href} className="group block">
      <div className={`relative h-full bg-gray-900/60 backdrop-blur-sm border ${c.borderColor} rounded-2xl p-5 transition-all duration-300 overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-36 h-36 ${c.bgGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg`}>
            <c.icon size={18} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_BADGE[c.difficulty]}`}>{c.difficulty}</span>
            <span className="text-xs text-gray-700 font-mono">#{String(c.id).padStart(2, "0")}</span>
          </div>
        </div>
        <h2 className="text-base font-bold text-white mb-0.5 group-hover:text-blue-200 transition-colors leading-snug">{c.title}</h2>
        <p className="text-xs text-gray-500 mb-3">{c.subtitle}</p>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{c.description}</p>
        <ul className="space-y-1 mb-3">
          {c.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
              <span className={`mt-1 w-1 h-1 rounded-full bg-gradient-to-r ${c.gradient} flex-shrink-0`} />
              {f}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {c.tags.map((tag) => (
            <span key={tag} className={`px-2 py-0.5 ${c.tagColor} rounded-full text-xs`}>{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-end pt-3 border-t border-gray-800/80">
          <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-white transition-colors">
            <span>进入案例</span>
            <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({
  color, title, count, desc, extra,
}: { color: string; title: string; count: string; desc: string; extra?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-1 h-6 bg-gradient-to-b ${color} rounded-full`} />
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${extra || "bg-gray-800 border-gray-700 text-gray-400"}`}>{count}</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
      <p className="text-sm text-gray-500 pl-4">{desc}</p>
    </div>
  );
}

// ─── 页面 ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070c1a] relative overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-600/4 rounded-full blur-3xl" />
        <div className="absolute top-2/3 right-1/3 w-[350px] h-[350px] bg-orange-600/4 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)", backgroundSize: "48px 48px" }} />
      </div>

      {/* 顶部导航 */}
      <header className="relative z-20 border-b border-gray-800/50 bg-[#070c1a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <FlaskConical size={16} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">大模型行业应用实验室</span>
              <span className="ml-2 text-xs text-gray-600 font-mono">LLM Lab</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="px-2.5 py-1 rounded-full border border-gray-700 bg-gray-800/50">v3.0</span>
            <span className="hidden md:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              13 个演示案例已就绪
            </span>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14">
        {/* Hero 区域 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/8 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-8">
            <Sparkles size={12} />
            <span>金融 · 互联网营销 · 教育 三大行业赛道</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight tracking-tight">
            大模型赋能
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent"> 行业应用 </span>
            实战课堂
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            13 个可运行的真实演示案例，覆盖 RAG、Agent、NL2SQL、情感分析等核心技术<br />
            <span className="text-gray-500 text-base">每个案例均提供可交互的 Web 演示 + 完整代码 + 教学文档</span>
          </p>

          {/* 统计指标 */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { icon: Layers, value: "13", label: "可运行案例", color: "text-blue-400" },
              { icon: Cpu, value: "3", label: "行业赛道", color: "text-violet-400" },
              { icon: Database, value: "20+", label: "AI 核心技术", color: "text-emerald-400" },
              { icon: TrendingUp, value: "3级", label: "难度分层", color: "text-amber-400" },
              { icon: Users, value: "全阶段", label: "适合学习者", color: "text-cyan-400" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <stat.icon size={14} className={stat.color} />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 难度说明条 */}
        <div className="flex items-center justify-center gap-6 mb-12 py-3 px-6 bg-gray-900/40 border border-gray-800 rounded-xl max-w-xl mx-auto text-xs">
          <span className="text-gray-500">难度参考：</span>
          <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" />基础 — 独立可完成</span>
          <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" />进阶 — 需有基础</span>
          <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400" />综合 — 系统性挑战</span>
        </div>

        {/* ── 金融行业案例 ── */}
        <div className="mb-14">
          <SectionHeader
            color="from-blue-500 to-cyan-500"
            title="金融行业案例"
            count="3 个案例"
            desc="聚焦金融 AI 的三大核心场景：智能问答、数据分析与投资研究，掌握大模型在专业金融场景中的工程化落地方法。"
            extra="bg-blue-500/8 border-blue-500/20 text-blue-400"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FINANCE_CASES.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </div>

        {/* ── 互联网营销案例 ── */}
        <div className="mb-14">
          <SectionHeader
            color="from-orange-500 to-pink-500"
            title="互联网营销案例"
            count="5 个案例"
            desc="覆盖内容生产、用户洞察、个性化推荐、直播电商、数据决策五大营销 AI 场景，贯穿从「内容创作」到「经营分析」的完整链路。"
            extra="bg-orange-500/8 border-orange-500/20 text-orange-400"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MARKETING_CASES.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </div>

        {/* ── 教育行业案例 ── */}
        <div className="mb-14">
          <SectionHeader
            color="from-emerald-500 to-cyan-500"
            title="教育行业案例"
            count="5 个案例"
            desc="面向中小学与高校两大场景，从学生视角（作业批改、学习规划）到教师视角（教学设计、课堂互动），再到科研视角（学术研究助手），全面展示教育 AI 应用图景。"
            extra="bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {EDUCATION_CASES.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </div>

        {/* 技术栈 + 学习路径 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* 技术栈 */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white">平台技术栈</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "前端", value: "Next.js 14", sub: "React · TypeScript · TailwindCSS" },
                { label: "后端", value: "FastAPI", sub: "Python · LangChain · Pydantic" },
                { label: "向量检索", value: "FAISS", sub: "语义搜索 · Embedding · RAG" },
                { label: "大模型", value: "OpenAI / DeepSeek", sub: "可配置切换 · 流式输出" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-800/50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                  <div className="text-white font-semibold text-sm">{item.value}</div>
                  <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 学习路径建议 */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">推荐学习路径</h3>
            </div>
            <div className="space-y-3">
              {[
                {
                  step: "1", label: "入门起步", color: "bg-emerald-500", textColor: "text-emerald-400",
                  cases: "案例2（数据分析）· 案例4（文案生成）· 案例9（作业批改）· 案例13（课堂问答）",
                  desc: "理解 LLM 基本调用与 Prompt 工程",
                },
                {
                  step: "2", label: "核心进阶", color: "bg-amber-500", textColor: "text-amber-400",
                  cases: "案例1（RAG问答）· 案例5（舆情分析）· 案例6（用户推荐）· 案例10（学习路径）· 案例11（教学设计）",
                  desc: "掌握 RAG、Embedding、情感分析等中间件技术",
                },
                {
                  step: "3", label: "综合挑战", color: "bg-rose-500", textColor: "text-rose-400",
                  cases: "案例3（投研全流程）· 案例7（数字人导购）· 案例8（决策Agent）· 案例12（学术研究）",
                  desc: "构建多工具 Agent 工作流与复杂系统设计",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className={`w-5 h-5 rounded-full ${item.color} flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5`}>{item.step}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold ${item.textColor}`}>{item.label}</span>
                      <span className="text-xs text-gray-500">{item.desc}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.cases}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="text-center pt-4 border-t border-gray-900">
          <p className="text-xs text-gray-700">
            大模型行业应用实验室 · 金融 × 营销 × 教育 · 仅供教学参考使用
          </p>
        </div>
      </div>
    </div>
  );
}
