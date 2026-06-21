import "server-only";
import { prisma } from "@/lib/db";
import { getQuote, searchEquity } from "@/lib/providers/equity";
import { getFund, searchFund } from "@/lib/providers/mutualFund";
import { getNews } from "@/lib/providers/news";
import type { Quote, FundInfo, NewsItem } from "@/lib/providers/types";
import { returnsFromPrices, annualizedVol, maxDrawdown, cagr } from "@/lib/engines/math";
import { llmComplete, getLlmConfig } from "./llm";
import { RESEARCH_MODES, type ResearchMode } from "@/lib/constants";

export type EntityType = "stock" | "mf" | "index" | "compare" | "unknown";

export type ResolvedEntity = {
  type: EntityType;
  symbol: string;
  name: string;
  quote?: Quote;
  fund?: FundInfo;
  second?: ResolvedEntity; // for compare
};

export type Evidence = {
  metrics: { label: string; value: string; detail?: string }[];
  news: NewsItem[];
  source: string; // data source label
};

export type AgentTraceItem = {
  agent: string;
  role: string;
  status: "done" | "fallback";
  model: string;
};

export type ResearchSection = { key: string; title: string; body: string; agent: string };

export type ResearchReport = {
  entityRef: string;
  entityName: string;
  entityType: EntityType;
  mode: ResearchMode;
  verdict: { stance: "Bullish" | "Neutral" | "Bearish" | "Mixed"; line: string };
  thesis: string;
  sections: ResearchSection[];
  evidence: Evidence;
  confidence: number;
  confidenceFactors: { label: string; score: number; detail: string }[];
  agentTrace: AgentTraceItem[];
  source: string;
  generatedAt: string;
};

// ---------------- Entity resolution ----------------

export async function resolveEntity(query: string): Promise<ResolvedEntity> {
  const q = query.trim();

  // Compare mode: "A vs B"
  const vs = q.split(/\s+vs\.?\s+/i);
  if (vs.length === 2) {
    const a = await resolveEntity(vs[0]);
    const b = await resolveEntity(vs[1]);
    return { type: "compare", symbol: `${a.symbol} vs ${b.symbol}`, name: `${a.name} vs ${b.name}`, quote: a.quote, fund: a.fund, second: b };
  }

  // Pure scheme code => MF
  if (/^\d{5,7}$/.test(q)) {
    const fund = await getFund(q);
    return { type: "mf", symbol: q, name: fund.name, fund };
  }

  // Known DB instrument/holding first (offline-friendly).
  const upper = q.toUpperCase();
  const inst = await prisma.instrument.findFirst({
    where: { OR: [{ symbol: upper }, { name: { contains: q } }] },
  });
  if (inst) {
    if (inst.type === "mf") {
      const fund = await getFund(inst.symbol, inst.name);
      return { type: "mf", symbol: inst.symbol, name: inst.name, fund };
    }
    const quote = await getQuote(inst.symbol, inst.name);
    return { type: inst.type === "index" ? "index" : "stock", symbol: inst.symbol, name: inst.name, quote };
  }

  // Live search: equity then fund.
  const eq = await searchEquity(q);
  if (eq.length) {
    const top = eq[0];
    const quote = await getQuote(top.symbol, top.name);
    return { type: "stock", symbol: top.symbol, name: top.name, quote };
  }
  const mf = await searchFund(q);
  if (mf.length) {
    const fund = await getFund(mf[0].schemeCode, mf[0].name);
    return { type: "mf", symbol: mf[0].schemeCode, name: mf[0].name, fund };
  }

  // Last resort: treat as a stock symbol and let the quote fall back.
  const quote = await getQuote(upper, q);
  return { type: "stock", symbol: upper, name: q, quote };
}

// ---------------- Evidence ----------------

function computeStockMetrics(quote: Quote): { label: string; value: string; detail?: string }[] {
  const closes = (quote.history ?? []).map((h) => h.close);
  const out: { label: string; value: string; detail?: string }[] = [
    { label: "Last price", value: `₹${quote.price.toFixed(2)}`, detail: `${quote.changePct >= 0 ? "+" : ""}${quote.changePct.toFixed(2)}% today` },
  ];
  if (closes.length > 20) {
    const r = (days: number) => {
      const idx = Math.max(0, closes.length - days);
      const past = closes[idx];
      return past ? ((closes[closes.length - 1] - past) / past) * 100 : 0;
    };
    out.push({ label: "1M return", value: `${r(21).toFixed(1)}%` });
    out.push({ label: "6M return", value: `${r(126).toFixed(1)}%` });
    out.push({ label: "1Y return", value: `${cagr(closes[0], closes[closes.length - 1], 1) * 100 || r(252)}`.slice(0, 6) + "%" });
    out.push({ label: "Volatility", value: `${(annualizedVol(returnsFromPrices(closes), 252) * 100).toFixed(0)}%`, detail: "annualized" });
    out.push({ label: "Max drawdown", value: `${(maxDrawdown(closes) * 100).toFixed(0)}%`, detail: "1Y peak-to-trough" });
  }
  return out;
}

function computeFundMetrics(fund: FundInfo): { label: string; value: string; detail?: string }[] {
  const out: { label: string; value: string; detail?: string }[] = [
    { label: "NAV", value: `₹${fund.nav.toFixed(2)}`, detail: fund.navDate },
    { label: "Category", value: fund.category },
  ];
  for (const r of fund.returns) out.push({ label: `${r.period} return`, value: `${r.value.toFixed(1)}%` });
  return out;
}

export async function gatherEvidence(entity: ResolvedEntity): Promise<Evidence> {
  const metrics =
    entity.type === "mf" && entity.fund
      ? computeFundMetrics(entity.fund)
      : entity.quote
        ? computeStockMetrics(entity.quote)
        : [];
  const news = await getNews(entity.name.split(" ").slice(0, 3).join(" "), 8);
  const source = entity.fund?.source ?? entity.quote?.source ?? "demo";
  const sourceLabel = source === "live" ? "Live market data" : source === "cached" ? "Cached market data" : "Demo data";
  return { metrics, news, source: sourceLabel };
}

// ---------------- Agent specifications ----------------

type AgentSpec = { key: string; title: string; role: string; focus: string };

const STOCK_AGENTS: AgentSpec[] = [
  { key: "business", title: "Business Analysis", role: "Business Analyst", focus: "the business model, revenue sources, moat and competitive position" },
  { key: "financial", title: "Financial Analysis", role: "Financial Analyst", focus: "financial health, profitability trends, balance-sheet strength implied by returns and volatility" },
  { key: "valuation", title: "Valuation Analysis", role: "Valuation Analyst", focus: "whether the current price and recent run-up look cheap, fair or expensive" },
  { key: "growth", title: "Growth Analysis", role: "Growth Analyst", focus: "growth drivers, opportunities and momentum given recent performance" },
  { key: "risk", title: "Risk Analysis", role: "Risk Analyst", focus: "key risks, volatility, drawdown behaviour and what could go wrong" },
  { key: "competitive", title: "Competitive Analysis", role: "Industry Analyst", focus: "competitive landscape and threats in the sector" },
  { key: "bull", title: "Bull Case", role: "Bull-side Analyst", focus: "the strongest realistic upside scenario and why it could play out" },
  { key: "bear", title: "Bear Case", role: "Bear-side Analyst", focus: "the strongest downside scenario and what would trigger it" },
  { key: "base", title: "Base Case", role: "Lead Analyst", focus: "the most likely outcome balancing bull and bear" },
];

const FUND_AGENTS: AgentSpec[] = [
  { key: "strategy", title: "Strategy & Style", role: "Fund Analyst", focus: "the fund's mandate, style and where it fits in a portfolio" },
  { key: "performance", title: "Performance Analysis", role: "Performance Analyst", focus: "return consistency across periods and vs its category" },
  { key: "holdings", title: "Holdings & Concentration", role: "Portfolio Analyst", focus: "holdings concentration, overlap risk and diversification quality" },
  { key: "cost", title: "Cost & Efficiency", role: "Cost Analyst", focus: "expense efficiency and its drag on long-term returns" },
  { key: "risk", title: "Risk Analysis", role: "Risk Analyst", focus: "volatility, downside behaviour and suitability by risk profile" },
  { key: "suitability", title: "Suitability", role: "Advisor", focus: "who this fund suits and how much to allocate" },
  { key: "bull", title: "Bull Case", role: "Bull-side Analyst", focus: "the case for this fund outperforming" },
  { key: "bear", title: "Bear Case", role: "Bear-side Analyst", focus: "the case for underperformance or better alternatives" },
  { key: "base", title: "Base Case", role: "Lead Analyst", focus: "the balanced verdict and allocation guidance" },
];

function agentsForMode(type: EntityType, mode: ResearchMode): AgentSpec[] {
  const all = type === "mf" ? FUND_AGENTS : STOCK_AGENTS;
  const count = RESEARCH_MODES.find((m) => m.id === mode)?.agents ?? 5;
  return all.slice(0, Math.min(count, all.length));
}

// ---------------- Section generation ----------------

function evidenceText(entity: ResolvedEntity, evidence: Evidence): string {
  const lines = evidence.metrics.map((m) => `- ${m.label}: ${m.value}${m.detail ? ` (${m.detail})` : ""}`);
  const news = evidence.news.slice(0, 5).map((n) => `- [${n.impact}] ${n.title}`);
  return `Entity: ${entity.name} (${entity.symbol})\nKey metrics:\n${lines.join("\n")}\nRecent headlines:\n${news.join("\n") || "- none"}`;
}

async function runAgent(
  entity: ResolvedEntity,
  spec: AgentSpec,
  evidence: Evidence,
  useLlm: boolean,
): Promise<{ section: ResearchSection; trace: AgentTraceItem }> {
  const cfg = getLlmConfig();
  if (useLlm) {
    try {
      const system = `You are a ${spec.role} on an equity/fund research desk. Write ONLY the "${spec.title}" section of a research report. Focus on ${spec.focus}. Be specific, evidence-based and concise (2-4 short paragraphs or tight bullets). Ground every claim in the provided metrics and headlines. Never give direct buy/sell advice or guarantee returns — this is educational analysis. Do not include a heading; start directly with the analysis.`;
      const user = `${evidenceText(entity, evidence)}\n\nWrite the ${spec.title}.`;
      const body = await llmComplete(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        { temperature: 0.55, maxTokens: 420, timeoutMs: 40000 },
      );
      return { section: { key: spec.key, title: spec.title, body, agent: spec.role }, trace: { agent: spec.role, role: spec.title, status: "done", model: cfg.model } };
    } catch {
      // fall through to deterministic
    }
  }
  const body = deterministicSection(entity, spec, evidence);
  return { section: { key: spec.key, title: spec.title, body, agent: spec.role }, trace: { agent: spec.role, role: spec.title, status: "fallback", model: "deterministic" } };
}

function deterministicSection(entity: ResolvedEntity, spec: AgentSpec, evidence: Evidence): string {
  const m = (label: string) => evidence.metrics.find((x) => x.label.includes(label))?.value ?? "n/a";
  const posNews = evidence.news.filter((n) => n.impact === "positive").length;
  const negNews = evidence.news.filter((n) => n.impact === "negative").length;
  const name = entity.name;
  switch (spec.key) {
    case "business":
      return `${name} operates in the ${entity.quote?.meta ? "listed equity" : entity.fund?.category ?? "market"} space. A durable business is reflected in steadier price action and resilience through drawdowns; here the observed volatility is ${m("Volatility")} with a worst drawdown of ${m("Max drawdown")}. Assess whether revenue is concentrated or diversified, and whether the moat (brand, cost, network or switching costs) is widening.`;
    case "financial":
      return `Financial strength can be inferred from how the asset behaves: a 1-year return of ${m("1Y")} alongside ${m("Volatility")} volatility suggests ${negNews > posNews ? "some operational headwinds in recent news" : "a reasonably healthy trajectory"}. Verify margins, debt levels and cash generation in the latest filings before concluding.`;
    case "valuation":
      return `After a 6-month move of ${m("6M")}, valuation matters. If price has run well ahead of fundamentals, future returns compress. Compare the current multiple to its own history and peers; a rich multiple needs growth to justify it, a cheap one needs a catalyst.`;
    case "growth":
      return `Momentum is ${m("1M")} over the last month. Growth durability depends on the addressable market and execution. Recent headlines skew ${posNews >= negNews ? "constructive" : "cautious"} (${posNews} positive vs ${negNews} negative), a soft signal on near-term direction.`;
    case "risk":
      return `Primary risks: volatility of ${m("Volatility")} and a max drawdown of ${m("Max drawdown")} indicate how sharply this can fall in stress. ${negNews > 0 ? `${negNews} recent negative headline(s) flag event risk.` : "News flow is currently benign."} Size the position so a worst-case drawdown stays within your comfort.`;
    case "competitive":
      return `Competitive position drives long-term returns. Identify the 2-3 closest competitors and whether ${name} is gaining or losing share. Pricing power and customer stickiness are the signals that separate winners from the pack.`;
    case "bull":
      return `Bull case: execution stays strong, the ${m("6M")} 6-month momentum extends, and positive news flow (${posNews} items) converts into sustained re-rating. In this scenario the asset compounds above market.`;
    case "bear":
      return `Bear case: the ${m("Max drawdown")} drawdown profile repeats in a market wobble, growth disappoints, or the ${negNews} negative headline(s) prove structural. Downside is amplified by elevated volatility of ${m("Volatility")}.`;
    case "base":
      return `Base case: the most likely path sits between the bull and bear — returns roughly tracking the sector with periodic volatility. Net headline tone is ${posNews - negNews >= 0 ? "mildly positive" : "mildly negative"}. Hold to plan, size sensibly, and revisit on a thesis change.`;
    case "strategy":
      return `${name} is a ${entity.fund?.category ?? "fund"} mandate. It fits investors seeking exposure to that segment; match the fund's style to the role you need it to play (core, satellite or diversifier).`;
    case "performance":
      return `Returns: ${evidence.metrics.filter((x) => x.label.includes("return")).map((x) => `${x.label} ${x.value}`).join(", ")}. Look for consistency across periods rather than a single strong year — steady relative performance signals process quality.`;
    case "holdings":
      return `Concentration and overlap are the hidden risks in funds. If top holdings mirror funds you already own, the diversification benefit shrinks. Check the top-10 weight and sector tilts.`;
    case "cost":
      return `Expense ratio is a guaranteed drag. Even 0.5% extra cost compounds to a meaningful gap over a decade. Prefer the lower-cost option when strategies are similar.`;
    case "suitability":
      return `Suitability depends on horizon and risk tolerance. With observed return/volatility characteristics, this suits ${entity.fund?.category?.toLowerCase().includes("small") ? "long-horizon, higher-risk" : "balanced"} investors. Keep any single fund to a sensible share of the portfolio.`;
    default:
      return `Analysis grounded in: ${evidence.metrics.map((x) => `${x.label} ${x.value}`).slice(0, 4).join(", ")}.`;
  }
}

// ---------------- Confidence ----------------

function computeConfidence(entity: ResolvedEntity, evidence: Evidence, usedLlm: boolean): { score: number; factors: { label: string; score: number; detail: string }[] } {
  const live = evidence.source.startsWith("Live");
  const dataCompleteness = Math.min(1, evidence.metrics.length / 6);
  const newsDepth = Math.min(1, evidence.news.length / 6);
  const factors = [
    { label: "Data completeness", score: Math.round(dataCompleteness * 100), detail: `${evidence.metrics.length} quantitative metrics gathered.` },
    { label: "Data freshness", score: live ? 90 : 55, detail: live ? "Live market data." : "Falling back to cached/demo data." },
    { label: "News coverage", score: Math.round(newsDepth * 100), detail: `${evidence.news.length} recent headlines analysed.` },
    { label: "Analyst depth", score: usedLlm ? 85 : 65, detail: usedLlm ? "Full LLM analyst team engaged." : "Deterministic analysis (no LLM key set)." },
  ];
  const score = factors.reduce((s, f) => s + f.score, 0) / factors.length / 100;
  return { score, factors };
}

function deriveVerdict(evidence: Evidence): ResearchReport["verdict"] {
  const pos = evidence.news.filter((n) => n.impact === "positive").length;
  const neg = evidence.news.filter((n) => n.impact === "negative").length;
  const oneY = parseFloat(evidence.metrics.find((m) => m.label.includes("1Y"))?.value ?? "0");
  const score = (pos - neg) + (oneY > 15 ? 1 : oneY < 0 ? -1 : 0);
  if (score >= 2) return { stance: "Bullish", line: "Momentum and news flow lean constructive." };
  if (score <= -2) return { stance: "Bearish", line: "Recent signals lean cautious — manage downside." };
  if (pos > 0 && neg > 0) return { stance: "Mixed", line: "Conflicting signals — a balanced, watchful stance fits." };
  return { stance: "Neutral", line: "No decisive edge either way on current evidence." };
}

// ---------------- Orchestration ----------------

export async function runResearch(query: string, mode: ResearchMode): Promise<ResearchReport> {
  const entity = await resolveEntity(query);

  if (entity.type === "compare" && entity.second) {
    return runCompare(entity, mode);
  }

  const evidence = await gatherEvidence(entity);
  const cfg = getLlmConfig();
  const useLlm = cfg.provider !== "none";
  const specs = agentsForMode(entity.type, mode);

  // Run analyst agents with bounded concurrency.
  const results = await mapLimit(specs, 3, (spec) => runAgent(entity, spec, evidence, useLlm));
  const sections = results.map((r) => r.section);
  const agentTrace = results.map((r) => r.trace);
  const usedLlm = agentTrace.some((t) => t.status === "done");

  const { score, factors } = computeConfidence(entity, evidence, usedLlm);
  const verdict = deriveVerdict(evidence);
  const thesis = await synthesizeThesis(entity, sections, evidence, verdict, useLlm);

  return {
    entityRef: entity.symbol,
    entityName: entity.name,
    entityType: entity.type,
    mode,
    verdict,
    thesis,
    sections,
    evidence,
    confidence: score,
    confidenceFactors: factors,
    agentTrace: [{ agent: "Evidence Gatherer", role: "Data collection", status: "done", model: evidence.source }, ...agentTrace],
    source: usedLlm ? cfg.label : "Deterministic engine",
    generatedAt: new Date().toISOString(),
  };
}

async function synthesizeThesis(
  entity: ResolvedEntity,
  sections: ResearchSection[],
  evidence: Evidence,
  verdict: ResearchReport["verdict"],
  useLlm: boolean,
): Promise<string> {
  if (useLlm) {
    try {
      const digest = sections.map((s) => `${s.title}: ${s.body.slice(0, 280)}`).join("\n");
      const body = await llmComplete(
        [
          { role: "system", content: "You are the lead analyst. Write a 3-4 sentence Executive Summary / Investment Thesis synthesizing the section analyses below. Educational only, no buy/sell directives." },
          { role: "user", content: `${entity.name}\nVerdict: ${verdict.stance}\n${digest}\n\nWrite the executive summary.` },
        ],
        { temperature: 0.5, maxTokens: 260, timeoutMs: 35000 },
      );
      return body;
    } catch {
      /* fall through */
    }
  }
  const m = evidence.metrics.map((x) => `${x.label} ${x.value}`).slice(0, 4).join(", ");
  return `${entity.name} presents a ${verdict.stance.toLowerCase()} setup on current evidence (${m}). ${verdict.line} This is an evidence-based educational analysis — weigh it against your goals, horizon and existing exposure before acting.`;
}

// ---------------- Compare ----------------

async function runCompare(entity: ResolvedEntity, mode: ResearchMode): Promise<ResearchReport> {
  const a = entity;
  const b = entity.second!;
  const [evA, evB] = await Promise.all([gatherEvidence(a), gatherEvidence(b)]);
  const cfg = getLlmConfig();
  const useLlm = cfg.provider !== "none";

  const dims = [
    { key: "returns", title: "Returns & Momentum" },
    { key: "risk", title: "Risk & Stability" },
    { key: "valuation", title: "Valuation / Cost" },
    { key: "verdict", title: "Which Wins, For Whom" },
  ];
  const trace: AgentTraceItem[] = [{ agent: "Evidence Gatherer", role: "Data collection", status: "done", model: `${evA.source} / ${evB.source}` }];

  const sections: ResearchSection[] = [];
  for (const dim of dims) {
    let body = "";
    let status: AgentTraceItem["status"] = "fallback";
    if (useLlm) {
      try {
        body = await llmComplete(
          [
            { role: "system", content: `You are a comparison analyst. Write the "${dim.title}" comparison between two assets. Be specific and balanced, cite the metrics, educational only.` },
            { role: "user", content: `A: ${evidenceText(a, evA)}\n\nB: ${evidenceText(b, evB)}\n\nWrite the ${dim.title} comparison.` },
          ],
          { temperature: 0.5, maxTokens: 360, timeoutMs: 35000 },
        );
        status = "done";
      } catch {
        body = `Comparing ${a.name} vs ${b.name} on ${dim.title.toLowerCase()}: ${evA.metrics.slice(0, 3).map((m) => m.label + " " + m.value).join(", ")} vs ${evB.metrics.slice(0, 3).map((m) => m.label + " " + m.value).join(", ")}.`;
      }
    } else {
      body = `Comparing ${a.name} vs ${b.name} on ${dim.title.toLowerCase()}: ${evA.metrics.slice(0, 3).map((m) => m.label + " " + m.value).join(", ")} versus ${evB.metrics.slice(0, 3).map((m) => m.label + " " + m.value).join(", ")}. Weigh the trade-off against your risk profile.`;
    }
    sections.push({ key: dim.key, title: dim.title, body, agent: "Comparison Analyst" });
    trace.push({ agent: "Comparison Analyst", role: dim.title, status, model: status === "done" ? cfg.model : "deterministic" });
  }

  const usedLlm = trace.some((t) => t.status === "done");
  const { score, factors } = computeConfidence(a, evA, usedLlm);
  return {
    entityRef: a.symbol,
    entityName: entity.name,
    entityType: "compare",
    mode,
    verdict: { stance: "Mixed", line: "Each asset wins on different dimensions — the right pick depends on your goals." },
    thesis: `${a.name} and ${b.name} differ across returns, risk and cost. ${a.name}: ${evA.metrics.slice(0, 2).map((m) => m.value).join(", ")}; ${b.name}: ${evB.metrics.slice(0, 2).map((m) => m.value).join(", ")}. Choose based on which trade-off fits your horizon and risk appetite.`,
    sections,
    evidence: { metrics: [...evA.metrics.map((m) => ({ ...m, label: `${a.name}: ${m.label}` })), ...evB.metrics.map((m) => ({ ...m, label: `${b.name}: ${m.label}` }))], news: [...evA.news.slice(0, 3), ...evB.news.slice(0, 3)], source: `${evA.source} / ${evB.source}` },
    confidence: score,
    confidenceFactors: factors,
    agentTrace: trace,
    source: usedLlm ? cfg.label : "Deterministic engine",
    generatedAt: new Date().toISOString(),
  };
}

// Bounded-concurrency map.
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
