const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const api = {
  base: BASE_URL,

  // 案例1：RAG 问答
  case1: {
    upload: `${BASE_URL}/api/case1/upload`,
    documents: `${BASE_URL}/api/case1/documents`,
    deleteDoc: (id: string) => `${BASE_URL}/api/case1/documents/${id}`,
    chat: `${BASE_URL}/api/case1/chat`,
    defaultPrompt: `${BASE_URL}/api/case1/default-prompt`,
  },

  // 案例2：数据分析
  case2: {
    stocks: `${BASE_URL}/api/case2/stocks`,
    analyze: `${BASE_URL}/api/case2/analyze`,
    stockData: (symbol: string, type: string) =>
      `${BASE_URL}/api/case2/data/${symbol}?data_type=${type}`,
    exampleQueries: `${BASE_URL}/api/case2/example-queries`,
    promptTemplates: `${BASE_URL}/api/case2/prompt-templates`,
  },

  // 案例3：投研全流程
  case3: {
    industryChain: `${BASE_URL}/api/case3/industry-chain`,
    infoSummary: `${BASE_URL}/api/case3/info-summary`,
    score: `${BASE_URL}/api/case3/score`,
    report: `${BASE_URL}/api/case3/report`,
    sampleCompanies: `${BASE_URL}/api/case3/sample-companies`,
    promptTemplates: `${BASE_URL}/api/case3/prompt-templates`,
  },

  // 案例4：智能营销文案生成
  case4: {
    generate: `${BASE_URL}/api/case4/generate`,
    platforms: `${BASE_URL}/api/case4/platforms`,
  },

  // 案例5：社交媒体舆情洞察
  case5: {
    sampleData: `${BASE_URL}/api/case5/sample-data`,
    analyze: `${BASE_URL}/api/case5/analyze`,
  },

  // 案例6：智能推荐与用户分层
  case6: {
    users: `${BASE_URL}/api/case6/users`,
    products: `${BASE_URL}/api/case6/products`,
    segments: `${BASE_URL}/api/case6/segments`,
    recommend: `${BASE_URL}/api/case6/recommend`,
  },

  // 案例7：数字人直播导购助手
  case7: {
    products: `${BASE_URL}/api/case7/products`,
    knowledge: `${BASE_URL}/api/case7/knowledge`,
    chat: `${BASE_URL}/api/case7/chat`,
  },

  // 案例8：营销数据决策智能体
  case8: {
    dashboard: `${BASE_URL}/api/case8/dashboard`,
    exampleQueries: `${BASE_URL}/api/case8/example-queries`,
    query: `${BASE_URL}/api/case8/query`,
  },
};

export async function streamFetch(
  url: string,
  body: object,
  onChunk: (data: Record<string, unknown>) => void,
  onDone?: () => void,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") {
          onDone?.();
          return;
        }
        try {
          const data = JSON.parse(raw);
          onChunk(data);
        } catch {
          // ignore parse errors
        }
      }
    }
  }
  onDone?.();
}
