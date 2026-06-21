import "server-only";

export type LlmProvider = "openrouter" | "gemini" | "groq" | "ollama" | "none";
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmConfig = { provider: LlmProvider; model: string; label: string };

/** Resolve the active free-LLM provider from environment. */
export function getLlmConfig(): LlmConfig {
  const forced = process.env.AI_PROVIDER as LlmProvider | undefined;
  const has = (k: string) => !!process.env[k];

  const pick = (p: LlmProvider): LlmConfig => {
    switch (p) {
      case "openrouter":
        return { provider: p, model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free", label: "OpenRouter (free)" };
      case "gemini":
        return { provider: p, model: process.env.GEMINI_MODEL || "gemini-2.0-flash", label: "Google Gemini (free tier)" };
      case "groq":
        return { provider: p, model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile", label: "Groq (free)" };
      case "ollama":
        return { provider: p, model: process.env.OLLAMA_MODEL || "llama3.1", label: "Ollama (local)" };
      default:
        return { provider: "none", model: "deterministic", label: "Deterministic engine" };
    }
  };

  if (forced && forced !== "none") return pick(forced);
  if (has("OPENROUTER_API_KEY")) return pick("openrouter");
  if (has("GEMINI_API_KEY")) return pick("gemini");
  if (has("GROQ_API_KEY")) return pick("groq");
  if (has("OLLAMA_MODEL")) return pick("ollama");
  return pick("none");
}

export function llmAvailable(): boolean {
  return getLlmConfig().provider !== "none";
}

/** Single completion call against the active provider. Throws if provider="none" or on error. */
export async function llmComplete(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): Promise<string> {
  const cfg = getLlmConfig();
  if (cfg.provider === "none") throw new Error("No LLM provider configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 45000);
  try {
    switch (cfg.provider) {
      case "openrouter":
        return await openAICompatible(
          "https://openrouter.ai/api/v1/chat/completions",
          process.env.OPENROUTER_API_KEY!,
          cfg.model,
          messages,
          opts,
          controller.signal,
          { "HTTP-Referer": "https://finpilot.ai", "X-Title": "FinPilot AI" },
        );
      case "groq":
        return await openAICompatible("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY!, cfg.model, messages, opts, controller.signal);
      case "gemini":
        return await geminiComplete(cfg.model, messages, opts, controller.signal);
      case "ollama":
        return await ollamaComplete(cfg.model, messages, opts, controller.signal);
      default:
        throw new Error("No provider");
    }
  } finally {
    clearTimeout(timer);
  }
}

async function openAICompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number },
  signal: AbortSignal,
  extraHeaders: Record<string, string> = {},
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({ model, messages, temperature: opts.temperature ?? 0.6, max_tokens: opts.maxTokens ?? 1200 }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty LLM response");
  return text.trim();
}

async function geminiComplete(
  model: string,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number },
  signal: AbortSignal,
): Promise<string> {
  const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: sys ? { parts: [{ text: sys }] } : undefined,
      generationConfig: { temperature: opts.temperature ?? 0.6, maxOutputTokens: opts.maxTokens ?? 1200 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text) throw new Error("Empty Gemini response");
  return text.trim();
}

async function ollamaComplete(
  model: string,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number },
  signal: AbortSignal,
): Promise<string> {
  const base = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false, options: { temperature: opts.temperature ?? 0.6, num_predict: opts.maxTokens ?? 1200 } }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = (await res.json()) as { message?: { content?: string } };
  const text = data.message?.content;
  if (!text) throw new Error("Empty Ollama response");
  return text.trim();
}
