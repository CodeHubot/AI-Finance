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
  },

  // 案例3：投研全流程
  case3: {
    industryChain: `${BASE_URL}/api/case3/industry-chain`,
    infoSummary: `${BASE_URL}/api/case3/info-summary`,
    score: `${BASE_URL}/api/case3/score`,
    report: `${BASE_URL}/api/case3/report`,
    sampleCompanies: `${BASE_URL}/api/case3/sample-companies`,
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
