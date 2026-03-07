/**
 * 将 Markdown 内容直接生成并下载 PDF（jsPDF + html2canvas + marked）
 * 无需打印对话框，点击即下载
 */
export async function exportMarkdownToPdf(markdownContent: string, title: string) {
  // 动态导入，避免 SSR 问题
  const { marked } = await import("marked");
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const htmlBody = await marked(markdownContent, { breaks: true });

  // ── 创建离屏白底容器 ──────────────────────────────────────────────────────
  const container = document.createElement("div");
  Object.assign(container.style, {
    position:   "absolute",
    left:       "-9999px",
    top:        "0",
    width:      "760px",
    background: "#ffffff",
    color:      "#1a1a1a",
    padding:    "40px 48px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize:   "13px",
    lineHeight: "1.75",
  });

  container.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      h1 { font-size:20px; font-weight:700; color:#111; border-bottom:2px solid #111;
           padding-bottom:8px; margin:0 0 16px; }
      h2 { font-size:15px; font-weight:700; color:#222; border-bottom:1px solid #ddd;
           padding-bottom:4px; margin:28px 0 10px; }
      h3 { font-size:13px; font-weight:600; color:#333; margin:18px 0 6px; }
      p  { margin:6px 0 10px; }
      blockquote {
        border-left:4px solid #4f46e5; margin:14px 0; padding:8px 16px;
        background:#f5f3ff; color:#3730a3; border-radius:0 6px 6px 0;
      }
      table { border-collapse:collapse; width:100%; margin:14px 0; font-size:12px; }
      th    { background:#f3f4f6; font-weight:600; }
      th,td { border:1px solid #d1d5db; padding:6px 10px; text-align:left; }
      tr:nth-child(even) td { background:#f9fafb; }
      code  { background:#f3f4f6; padding:1px 5px; border-radius:3px;
              font-family:Consolas,monospace; font-size:11.5px; }
      pre   { background:#f3f4f6; padding:12px 16px; border-radius:6px; overflow:hidden; }
      pre code { background:none; padding:0; }
      hr    { border:none; border-top:1px solid #e5e7eb; margin:22px 0; }
      ul,ol { padding-left:22px; margin:6px 0; }
      li    { margin:3px 0; }
      strong{ font-weight:700; color:#111; }
      em    { color:#555; }
    </style>

    <div style="font-size:10px;color:#9ca3af;border-bottom:1px solid #e5e7eb;
                padding-bottom:8px;margin-bottom:24px;display:flex;
                justify-content:space-between;">
      <span>AI 金融投研平台</span>
      <span>${title}</span>
      <span>${new Date().toLocaleDateString("zh-CN")}</span>
    </div>

    ${htmlBody}

    <div style="font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;
                padding-top:8px;margin-top:32px;text-align:center;">
      本报告由 AI 辅助生成，仅供教学参考，不构成任何投资建议
    </div>
  `;

  document.body.appendChild(container);

  try {
    // ── html2canvas 截取全文 ──────────────────────────────────────────────
    const canvas = await html2canvas(container, {
      scale:           1.8,          // 提高清晰度
      backgroundColor: "#ffffff",
      useCORS:         true,
      logging:         false,
    });

    // ── jsPDF 分页写入 ────────────────────────────────────────────────────
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin    = 12;                                   // mm
    const pageW     = pdf.internal.pageSize.getWidth();     // 210
    const pageH     = pdf.internal.pageSize.getHeight();    // 297
    const contentW  = pageW - margin * 2;                   // 186 mm
    const availH    = pageH - margin * 2;                   // 273 mm

    const canvasW   = canvas.width;
    const canvasH   = canvas.height;
    const mmPerPx   = contentW / canvasW;                   // mm / px
    const totalH    = canvasH * mmPerPx;                    // total mm height

    let yMm = 0;    // 已处理的高度 (mm)
    let page = 0;

    while (yMm < totalH) {
      if (page > 0) pdf.addPage();

      const sliceMm = Math.min(availH, totalH - yMm);
      const slicePx = Math.ceil(sliceMm / mmPerPx);
      const srcY    = Math.round(yMm / mmPerPx);

      // 剪切当前页对应的图像条带
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width  = canvasW;
      sliceCanvas.height = slicePx;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasW, slicePx);
      ctx.drawImage(canvas, 0, srcY, canvasW, slicePx, 0, 0, canvasW, slicePx);

      pdf.addImage(
        sliceCanvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        margin, margin,
        contentW, sliceMm,
      );

      // 页码
      pdf.setFontSize(9);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`${page + 1}`, pageW / 2, pageH - 5, { align: "center" });

      yMm += sliceMm;
      page++;
    }

    pdf.save(`${title}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
