import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 金融案例教学平台",
  description: "三大 AI 金融应用案例教学展示系统 — 智能问答、数据分析、投研全流程",
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
