import type { FinancialPicture, InsightItem } from "@/lib/types";
import { analyzeOverlap } from "./overlap";
import { formatINR } from "@/lib/utils";

export type SipAnalysis = {
  totalMonthly: number;
  count: number;
  byStyle: { style: string; amount: number; pct: number }[];
  goalAligned: number; // % of SIP amount mapped to a goal
  adequacy: { investingEnough: boolean; recommendedMonthly: number; gap: number };
  questions: { q: string; a: string }[];
  insights: InsightItem[];
};

export function analyzeSip(p: FinancialPicture): SipAnalysis {
  const sips = p.sips;
  const totalMonthly = sips.reduce((s, x) => s + x.amount, 0);

  // By fund style (from fundMeta).
  const styleMap = new Map<string, number>();
  for (const s of sips) {
    const style = p.fundMeta[s.symbol]?.style ?? "Other";
    styleMap.set(style, (styleMap.get(style) ?? 0) + s.amount);
  }
  const byStyle = [...styleMap.entries()]
    .map(([style, amount]) => ({ style, amount, pct: (amount / (totalMonthly || 1)) * 100 }))
    .sort((a, b) => b.amount - a.amount);

  const goalAlignedAmt = sips.filter((s) => s.goalId).reduce((s, x) => s + x.amount, 0);
  const goalAligned = totalMonthly ? (goalAlignedAmt / totalMonthly) * 100 : 0;

  // Adequacy: rule of thumb — invest >=20% of income.
  const recommendedMonthly = Math.round(p.user.monthlyIncome * 0.25);
  const gap = Math.max(0, recommendedMonthly - totalMonthly);
  const investingEnough = totalMonthly >= p.user.monthlyIncome * 0.2;

  const overlap = analyzeOverlap(p);
  const insights: InsightItem[] = [];

  if (overlap.pairs[0] && overlap.pairs[0].overlapPct > 25) {
    insights.push({
      id: "sip-overlap",
      type: "sip",
      title: "Your SIPs overlap",
      body: `${overlap.pairs[0].fundA} and ${overlap.pairs[0].fundB} share ${overlap.pairs[0].overlapPct.toFixed(0)}% of their top holdings. Two funds doing the same job dilutes diversification benefit.`,
      severity: "warning",
      evidence: [{ label: "Shared names", value: overlap.pairs[0].shared.slice(0, 5).join(", ") }],
      confidence: 0.78,
      route: "/sip",
      action: "Consider consolidating overlapping funds into one.",
    });
  }
  if (!investingEnough) {
    insights.push({
      id: "sip-adequacy",
      type: "sip",
      title: "You could invest more",
      body: `You're investing ${formatINR(totalMonthly, { compact: true })}/month (${((totalMonthly / p.user.monthlyIncome) * 100).toFixed(0)}% of income). Aiming for ~25% would accelerate your goals.`,
      severity: "info",
      evidence: [{ label: "Current SIP", value: formatINR(totalMonthly) }, { label: "Suggested", value: formatINR(recommendedMonthly) }],
      confidence: 0.7,
      route: "/sip",
      action: `Step up SIP by ${formatINR(gap, { compact: true })}/month when affordable.`,
    });
  }
  const smallcapPct = byStyle.find((s) => s.style === "Small Cap")?.pct ?? 0;
  if (smallcapPct > 25) {
    insights.push({
      id: "sip-smallcap",
      type: "sip",
      title: "High small-cap tilt in SIPs",
      body: `${smallcapPct.toFixed(0)}% of your monthly SIP goes to small-caps. Great for long horizons but volatile — keep this aligned to your risk appetite.`,
      severity: "info",
      evidence: [{ label: "Small-cap SIP", value: `${smallcapPct.toFixed(0)}%` }],
      confidence: 0.72,
      route: "/sip",
    });
  }

  const questions = [
    { q: "Am I investing enough?", a: investingEnough ? `Yes — you invest ${((totalMonthly / p.user.monthlyIncome) * 100).toFixed(0)}% of income, above the 20% benchmark. Stepping up to 25% (${formatINR(recommendedMonthly, { compact: true })}) would build wealth faster.` : `Not quite. You're at ${((totalMonthly / p.user.monthlyIncome) * 100).toFixed(0)}% of income; aim for at least 20–25% (${formatINR(recommendedMonthly, { compact: true })}/month).` },
    { q: "Are my SIPs overlapping?", a: overlap.summary },
    { q: "Are my SIPs aligned with goals?", a: `${goalAligned.toFixed(0)}% of your SIP amount is mapped to a specific goal. ${goalAligned < 80 ? "Map the rest to goals so progress is trackable." : "Strong alignment — every rupee has a purpose."}` },
    { q: "Am I taking unnecessary risk?", a: smallcapPct > 25 ? `Small-caps are ${smallcapPct.toFixed(0)}% of SIPs — on the higher side. Fine for a long horizon, but trim if a house purchase is near.` : "Your style mix looks balanced relative to a balanced risk profile." },
  ];

  return {
    totalMonthly,
    count: sips.length,
    byStyle,
    goalAligned,
    adequacy: { investingEnough, recommendedMonthly, gap },
    questions,
    insights,
  };
}
