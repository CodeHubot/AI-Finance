"use client";
import Link from "next/link";
import { Brain, BarChart3, LineChart, ArrowRight, Sparkles, BookOpen, Users } from "lucide-react";

const cases = [
  {
    id: 1,
    href: "/case1",
    icon: Brain,
    gradient: "from-blue-600 to-cyan-500",
    bgGlow: "bg-blue-500/10",
    borderColor: "border-blue-500/30 hover:border-blue-400/60",
    tagColor: "bg-blue-500/20 text-blue-300",
    title: "智能金融问答助手",
    subtitle: "生成式 AI + RAG 知识库",
    description:
      "从金融业务需求拆解、场景化提示词设计，到 RAG 金融知识库构建，再到可视化交互原型开发，层层递进完成 AI 金融咨询助手的全流程落地。",
    features: [
      "PDF/TXT 文档上传与向量化",
      "提示词工程可视化调试",
      "RAG 流式对话 + 来源引用",
      "ChromaDB 向量检索",
    ],
    tags: ["LangChain", "RAG", "ChromaDB", "流式输出"],
    difficulty: "进阶",
  },
  {
    id: 2,
    href: "/case2",
    icon: BarChart3,
    gradient: "from-emerald-600 to-teal-500",
    bgGlow: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-400/60",
    tagColor: "bg-emerald-500/20 text-emerald-300",
    title: "金融数据分析实战",
    subtitle: "自然语言 → 数据洞察",
    description:
      "掌握金融数据全生命周期处理方法，通过「自然语言提问→AI语义解析→金融数据映射→自动化分析报告」全链路逻辑，实现从数据到决策参考的高效转化。",
    features: [
      "自然语言驱动的数据查询",
      "10 支主流 A 股模拟数据",
      "ECharts 动态图表生成",
      "AI 分析报告自动输出",
    ],
    tags: ["ECharts", "Pandas", "NL2SQL", "报告生成"],
    difficulty: "基础",
  },
  {
    id: 3,
    href: "/case3",
    icon: LineChart,
    gradient: "from-violet-600 to-purple-500",
    bgGlow: "bg-violet-500/10",
    borderColor: "border-violet-500/30 hover:border-violet-400/60",
    tagColor: "bg-violet-500/20 text-violet-300",
    title: "投研全流程实践",
    subtitle: "企业投研辅助平台",
    description:
      "以企业投研辅助平台为实战载体，覆盖产业链图谱、多源信息聚合、企业评分模型、投研报告生成及投后风险监控，搭建可展示、可迭代的投研产品原型。",
    features: [
      "产业链图谱智能梳理",
      "多源信息（公告/研报/舆情）聚合",
      "AI 驱动多维度企业评分",
      "一键生成标准投研报告",
    ],
    tags: ["投研", "评分模型", "雷达图", "报告导出"],
    difficulty: "综合",
  },
];

const stats = [
  { icon: BookOpen, label: "教学案例", value: "3" },
  { icon: Sparkles, label: "AI 技术栈", value: "8+" },
  { icon: Users, label: "适合学生", value: "全阶段" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-600/6 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* 头部 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
            <Sparkles size={14} />
            <span>AI × 金融 教学实验平台</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            大模型赋能
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {" "}金融业务{" "}
            </span>
            实战
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            三大核心应用场景，从零到一完整落地
            <br />
            手把手带你掌握 AI 金融产品开发全流程
          </p>

          {/* 统计数据 */}
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

        {/* 案例卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {cases.map((c) => (
            <Link key={c.id} href={c.href} className="group block">
              <div
                className={`relative h-full bg-gray-900/60 backdrop-blur-sm border ${c.borderColor} rounded-2xl p-6 card-hover transition-all duration-300 overflow-hidden`}
              >
                {/* 背景光晕 */}
                <div
                  className={`absolute top-0 right-0 w-40 h-40 ${c.bgGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* 案例编号 */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <c.icon size={22} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-600 font-mono">案例 0{c.id}</span>
                </div>

                {/* 标题 */}
                <h2 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                  {c.title}
                </h2>
                <p className="text-sm text-gray-500 mb-3">{c.subtitle}</p>

                {/* 描述 */}
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{c.description}</p>

                {/* 功能点 */}
                <ul className="space-y-1.5 mb-5">
                  {c.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${c.gradient} flex-shrink-0`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* 技术标签 */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {c.tags.map((tag) => (
                    <span key={tag} className={`px-2 py-0.5 ${c.tagColor} rounded-full text-xs`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>难度：{c.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400 group-hover:text-white transition-colors">
                    <span>进入案例</span>
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 技术架构说明 */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">平台技术架构</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: "前端框架", value: "Next.js 14", sub: "React + TailwindCSS" },
              { label: "后端框架", value: "FastAPI", sub: "Python + LangChain" },
              { label: "向量数据库", value: "ChromaDB", sub: "语义检索引擎" },
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

        {/* 底部 */}
        <div className="text-center mt-10 text-gray-600 text-sm">
          AI 金融案例教学平台 · 仅供教学参考使用
        </div>
      </div>
    </div>
  );
}
