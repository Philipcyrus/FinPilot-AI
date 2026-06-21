import "server-only";
import { prisma, requireActiveUserId } from "@/lib/db";
import { getDashboard } from "@/lib/dashboard";
import { llmComplete, getLlmConfig, type ChatMessage } from "./llm";
import { formatINR } from "@/lib/utils";

/** Builds a grounded context block describing the user's finances + AI memory. */
async function buildContext(): Promise<string> {
  const userId = await requireActiveUserId();
  const [d, memories] = await Promise.all([getDashboard(), prisma.memory.findMany({ where: { userId } })]);
  const top = [...d.picture.holdings].sort((a, b) => b.value - a.value).slice(0, 5).map((h) => `${h.name} ${formatINR(h.value, { compact: true })} (${h.pnlPct.toFixed(0)}%)`).join(", ");
  const goals = d.goals.map((g) => `${g.goal.name}: ${(g.successProbability * 100).toFixed(0)}% on track`).join(", ");
  const mem = memories.map((m) => `- ${m.key}: ${m.value}`).join("\n");
  return [
    `User: ${d.picture.user.name}, monthly income ${formatINR(d.picture.user.monthlyIncome, { compact: true })}, ${d.picture.user.riskProfile} risk profile.`,
    `Financial Health Score: ${d.financialHealth.score}/100 (${d.financialHealth.label}). ${d.financialHealth.summary}`,
    `Net worth ${formatINR(d.netWorth, { compact: true })}; portfolio ${formatINR(d.portfolio.totalValue, { compact: true })} (${d.portfolio.pnlPct.toFixed(0)}% P/L, XIRR ${d.portfolio.xirr.toFixed(0)}%).`,
    `Savings rate ${d.savings.savingsRate.toFixed(0)}%, emergency fund ${d.savings.emergencyMonths.toFixed(1)} months.`,
    `Risk: ${d.risk.riskLevel} (vol ${d.risk.volatility.toFixed(0)}%, beta ${d.risk.beta.toFixed(2)}).`,
    `Top holdings: ${top}.`,
    `Goals: ${goals}.`,
    `SIPs: ${formatINR(d.sip.totalMonthly, { compact: true })}/month across ${d.sip.count} funds.`,
    mem ? `Remembered about this user:\n${mem}` : "",
  ].filter(Boolean).join("\n");
}

const SYSTEM = `You are FinPilot, a personal-CFO AI for an individual investor in India. You explain the user's finances clearly and give educational, evidence-based guidance grounded in the context provided. Principles:
- Be specific and reference the user's actual numbers from context.
- Explain *why*, cite evidence, note assumptions and risks.
- You may analyze, explain, simulate, educate and recommend — but NEVER execute trades, place orders, guarantee returns, or claim to be a registered adviser.
- Keep answers concise and skimmable (short paragraphs / bullets). Add a one-line disclaimer only when giving a recommendation.`;

export async function chatReply(history: ChatMessage[]): Promise<{ reply: string; source: string }> {
  const cfg = getLlmConfig();
  const context = await buildContext();
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "system", content: `CONTEXT (the user's live financial picture):\n${context}` },
    ...history.slice(-8),
  ];
  if (cfg.provider !== "none") {
    try {
      const reply = await llmComplete(messages, { temperature: 0.5, maxTokens: 700, timeoutMs: 40000 });
      return { reply, source: cfg.label };
    } catch {
      /* fall through */
    }
  }
  return { reply: deterministicReply(history[history.length - 1]?.content ?? "", context), source: "Deterministic engine" };
}

/** Heuristic, context-grounded fallback when no LLM is configured. */
function deterministicReply(question: string, context: string): string {
  const q = question.toLowerCase();
  const intro = "Here's what your data shows";
  let focus = "";
  if (/emergency|safe|buffer/.test(q)) focus = pickLines(context, ["emergency", "savings"]);
  else if (/risk|volatil|drawdown|beta/.test(q)) focus = pickLines(context, ["risk"]);
  else if (/goal|house|retire/.test(q)) focus = pickLines(context, ["goals"]);
  else if (/spend|expense|budget/.test(q)) focus = pickLines(context, ["savings"]);
  else if (/sip|invest enough|fund/.test(q)) focus = pickLines(context, ["sips", "portfolio"]);
  else focus = pickLines(context, ["financial health", "net worth", "portfolio"]);
  return `${intro}:\n\n${focus}\n\n_(No AI model is configured, so this is a deterministic summary from your financial engine. Add a free LLM key in Settings for richer, conversational answers.)_\n\nThis is educational information, not investment advice.`;
}

function pickLines(context: string, keys: string[]): string {
  const lines = context.split("\n");
  const hits = lines.filter((l) => keys.some((k) => l.toLowerCase().includes(k)));
  return (hits.length ? hits : lines.slice(0, 3)).map((l) => `• ${l}`).join("\n");
}
