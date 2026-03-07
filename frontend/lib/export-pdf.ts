/**
 * 将 Markdown 内容导出为 PDF（使用浏览器原生打印对话框，质量最佳）
 * 用户在打印对话框中选择"另存为 PDF" 即可保存
 */
export async function exportMarkdownToPdf(markdownContent: string, title: string) {
  const { marked } = await import("marked");

  // 配置 marked 以安全渲染
  marked.setOptions({ breaks: true });
  const htmlBody = await marked(markdownContent);

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("请允许弹出窗口以导出 PDF");
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a1a;
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #111; border-bottom: 2px solid #111; padding-bottom: 8px; }
    h2 { font-size: 16px; font-weight: 700; margin: 24px 0 8px; color: #222; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 14px; font-weight: 600; margin: 16px 0 6px; color: #333; }
    p  { margin: 6px 0 10px; }
    blockquote {
      border-left: 4px solid #4f46e5;
      margin: 12px 0;
      padding: 8px 16px;
      background: #f5f3ff;
      color: #3730a3;
      border-radius: 0 6px 6px 0;
    }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 12px; }
    th { background: #f3f4f6; font-weight: 600; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
    tr:nth-child(even) td { background: #f9fafb; }
    code {
      background: #f3f4f6;
      padding: 1px 5px;
      border-radius: 3px;
      font-family: "Cascadia Code", Consolas, monospace;
      font-size: 12px;
    }
    pre {
      background: #f3f4f6;
      padding: 12px 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 12px;
    }
    pre code { background: none; padding: 0; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    ul, ol { padding-left: 20px; margin: 6px 0; }
    li { margin: 3px 0; }
    strong { font-weight: 700; color: #111; }
    em { font-style: italic; color: #555; }
    /* 页眉页脚 */
    .pdf-header {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 24px;
    }
    .pdf-footer {
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 32px;
    }
    @media print {
      body { padding: 16px; max-width: 100%; }
      .no-print { display: none !important; }
      h2 { page-break-before: auto; }
      table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="pdf-header">AI 金融投研平台 · ${title} · ${new Date().toLocaleDateString("zh-CN")}</div>
  ${htmlBody}
  <div class="pdf-footer">本报告由 AI 辅助生成，仅供教学参考，不构成投资建议</div>
  <div class="no-print" style="position:fixed;bottom:20px;right:20px;">
    <button onclick="window.print()" style="background:#4f46e5;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;">
      打印 / 保存为 PDF
    </button>
  </div>
</body>
</html>`);

  printWindow.document.close();

  // 等待渲染后自动触发打印
  printWindow.onload = () => {
    setTimeout(() => printWindow.print(), 600);
  };
}
