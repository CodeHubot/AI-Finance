import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大模型行业应用实验室 | LLM Lab",
  description: "13 个可运行的大模型行业应用演示案例，覆盖金融、互联网营销与教育三大赛道，涵盖 RAG、Agent、NL2SQL、情感分析等核心 AI 技术。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
