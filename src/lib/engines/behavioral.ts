import type { FinancialPicture, InsightItem } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export type BehavioralAnalysis = {
  biases: { id: string; label: string; detected: boolean; detail: string; severity: "info" | "warning" }[];
  insights: InsightItem[];
};

/**
 * Behavioral pattern detection from transaction & holding history.
 * Educational only — flags tendencies, never judges.
 */
export function analyzeBehavior(p: FinancialPicture): BehavioralAnalysis {
  const trades = p.transactions.filter((t) => t.type === "buy" || t.type === "sell");
  const sells = trades.filter((t) => t.type === "sell");
  const buys = trades.filter((t) => t.type === "buy");

  // Concentration bias: any single position > 15%.
  const total = p.holdings.reduce((s, h) => s + h.value, 0) || 1;
  const maxPos = Math.max(...p.holdings.map((h) => h.value / total), 0);

  // Lifestyle inflation: rising discretionary spend (Shopping) over time.
  const shopping = p.transactions.filter((t) => t.category === "Shopping" && t.type === "expense");
  const half = Math.floor(shopping.length / 2);
  const earlyShop = shopping.slice(0, half).reduce((s, t) => s + t.amount, 0) / (half || 1);
  const lateShop = shopping.slice(half).reduce((s, t) => s + t.amount, 0) / (shopping.length - half || 1);
  const lifestyleUp = lateShop > earlyShop * 1.2;

  // Overtrading proxy: many trades in the window.
  const overtrading = trades.length > 24;

  const biases: BehavioralAnalysis["biases"] = [
    { id: "concentration", label: "Concentration bias", detected: maxPos > 0.15, severity: "warning", detail: maxPos > 0.15 ? `Largest position is ${(maxPos * 100).toFixed(0)}% — a strong conviction tilt that raises single-stock risk.` : "No single position dominates — healthy." },
    { id: "lifestyle", label: "Lifestyle inflation", detected: lifestyleUp, severity: "warning", detail: lifestyleUp ? `Discretionary (shopping) spend trended up ${(((lateShop - earlyShop) / (earlyShop || 1)) * 100).toFixed(0)}% — watch that it doesn't outpace income.` : "Discretionary spend is stable." },
    { id: "overtrading", label: "Overtrading", detected: overtrading, severity: "warning", detail: overtrading ? `${trades.length} trades in the window — frequent activity often hurts net returns via costs and timing.` : "Trading activity is measured — good for long-term compounding." },
    { id: "panic_selling", label: "Panic selling", detected: sells.length > buys.length && sells.length > 3, severity: "warning", detail: sells.length > buys.length && sells.length > 3 ? "More selling than buying recently — ensure decisions are plan-driven, not fear-driven." : "No evidence of reactive selling." },
    { id: "performance_chasing", label: "Performance chasing", detected: false, severity: "info", detail: "No clear pattern of buying recent winners at the top." },
  ];

  const insights: InsightItem[] = [];
  if (maxPos > 0.15) {
    const top = [...p.holdings].sort((a, b) => b.value - a.value)[0];
    insights.push({
      id: "behavior-concentration",
      type: "behavioral",
      title: "Watch single-stock concentration",
      body: `${top.name} is ${(maxPos * 100).toFixed(0)}% of your portfolio (${formatINR(top.value, { compact: true })}). Conviction is good, but a bad surprise here would hurt disproportionately. Consider trimming to under 15%.`,
      severity: "warning",
      evidence: [{ label: "Position", value: `${(maxPos * 100).toFixed(0)}%` }, { label: "Value", value: formatINR(top.value) }],
      confidence: 0.85,
      route: "/portfolio",
    });
  }
  if (lifestyleUp) {
    insights.push({
      id: "behavior-lifestyle",
      type: "behavioral",
      title: "Lifestyle creep in discretionary spend",
      body: `Your shopping spend has been climbing. The classic trap: as income rises, spending quietly rises with it, leaving savings rate flat. Automating investments before spending protects your future self.`,
      severity: "info",
      evidence: [{ label: "Early avg", value: formatINR(earlyShop, { compact: true }) }, { label: "Recent avg", value: formatINR(lateShop, { compact: true }) }],
      confidence: 0.72,
      route: "/spending",
    });
  }

  return { biases, insights };
}
