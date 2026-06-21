import type { FinancialPicture, AllocationSlice, SeriesPoint, InsightItem } from "@/lib/types";
import { CATEGORY_COLORS, MERCHANT_CATEGORY_RULES, SPENDING_CATEGORIES, type SpendingCategory } from "@/lib/constants";
import { mean, stdev } from "./math";
import { formatINR, formatMonth } from "@/lib/utils";

/** Rule-based category for a merchant/note string (used for imports). */
export function classifyMerchant(text: string): SpendingCategory {
  for (const [re, cat] of MERCHANT_CATEGORY_RULES) if (re.test(text)) return cat;
  return "Other";
}

export type SpendingAnalysis = {
  monthlySpend: number; // latest month
  avgMonthlySpend: number;
  byCategory: AllocationSlice[];
  monthlyTrend: SeriesPoint[];
  topMerchants: { merchant: string; amount: number; category: string }[];
  lifestyleInflation: number; // % change recent vs earlier
  anomalies: { merchant: string; amount: number; date: Date; category: string; reason: string }[];
  forecastNextMonth: number;
  insights: InsightItem[];
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function analyzeSpending(p: FinancialPicture): SpendingAnalysis {
  const expenses = p.transactions.filter((t) => t.direction === "out" && t.type === "expense");

  // Monthly totals
  const byMonth = new Map<string, number>();
  for (const e of expenses) byMonth.set(monthKey(e.date), (byMonth.get(monthKey(e.date)) ?? 0) + e.amount);
  const months = [...byMonth.keys()].sort();
  const monthlyTrend: SeriesPoint[] = months.map((m) => {
    const [y, mo] = m.split("-").map(Number);
    return { label: formatMonth(new Date(y, mo - 1, 1)), value: Math.round(byMonth.get(m) ?? 0) };
  });
  const monthValues = months.map((m) => byMonth.get(m) ?? 0);
  const monthlySpend = monthValues[monthValues.length - 1] ?? 0;
  const avgMonthlySpend = mean(monthValues);

  // By category (latest 3 months for relevance)
  const recentMonths = new Set(months.slice(-3));
  const catMap = new Map<string, number>();
  for (const e of expenses) if (recentMonths.has(monthKey(e.date))) catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
  const catTotal = [...catMap.values()].reduce((a, b) => a + b, 0) || 1;
  const byCategory: AllocationSlice[] = SPENDING_CATEGORIES.filter((c) => catMap.get(c))
    .map((c) => ({ name: c, value: catMap.get(c) ?? 0, pct: ((catMap.get(c) ?? 0) / catTotal) * 100, color: CATEGORY_COLORS[c] }))
    .sort((a, b) => b.value - a.value);

  // Top merchants
  const merchMap = new Map<string, { amount: number; category: string }>();
  for (const e of expenses) {
    const cur = merchMap.get(e.merchant) ?? { amount: 0, category: e.category };
    cur.amount += e.amount;
    merchMap.set(e.merchant, cur);
  }
  const topMerchants = [...merchMap.entries()]
    .map(([merchant, v]) => ({ merchant, amount: v.amount, category: v.category }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // Lifestyle inflation: recent half vs earlier half average monthly spend.
  const half = Math.floor(monthValues.length / 2);
  const earlier = mean(monthValues.slice(0, half));
  const recent = mean(monthValues.slice(half));
  const lifestyleInflation = earlier > 0 ? ((recent - earlier) / earlier) * 100 : 0;

  // Anomalies: expenses > mean + 2.5*stdev of that category.
  const catAmounts = new Map<string, number[]>();
  for (const e of expenses) {
    const arr = catAmounts.get(e.category) ?? [];
    arr.push(e.amount);
    catAmounts.set(e.category, arr);
  }
  const anomalies: SpendingAnalysis["anomalies"] = [];
  for (const e of expenses) {
    const arr = catAmounts.get(e.category) ?? [];
    const m = mean(arr);
    const sd = stdev(arr);
    if (sd > 0 && e.amount > m + 2.5 * sd && e.amount > 20000) {
      anomalies.push({ merchant: e.merchant, amount: e.amount, date: e.date, category: e.category, reason: `${(e.amount / m).toFixed(1)}× your usual ${e.category} spend` });
    }
  }
  anomalies.sort((a, b) => b.amount - a.amount);

  // Forecast: weighted moving average of last 3 months.
  const last3 = monthValues.slice(-3);
  const forecastNextMonth = last3.length ? (last3.reduce((s, v, i) => s + v * (i + 1), 0) / last3.reduce((s, _v, i) => s + (i + 1), 0)) : avgMonthlySpend;

  // Insights
  const insights: InsightItem[] = [];
  if (lifestyleInflation > 8) {
    insights.push({
      id: "lifestyle-inflation",
      type: "spending",
      title: "Lifestyle inflation detected",
      body: `Your average monthly spend rose ${lifestyleInflation.toFixed(0)}% over this period. Rising spend can quietly erode your savings rate even as income stays flat.`,
      severity: "warning",
      evidence: [
        { label: "Earlier avg", value: formatINR(earlier, { compact: true }) },
        { label: "Recent avg", value: formatINR(recent, { compact: true }) },
      ],
      confidence: 0.82,
      route: "/spending",
      action: "Review discretionary categories (Shopping, Food) and set a monthly cap.",
    });
  }
  for (const a of anomalies.slice(0, 1)) {
    insights.push({
      id: `anomaly-${a.merchant}`,
      type: "spending",
      title: `Unusual ${a.category} spike: ${a.merchant}`,
      body: `A ${formatINR(a.amount, { compact: true })} ${a.category.toLowerCase()} charge stands out — ${a.reason}. If one-off, no action needed; if recurring, factor it into your budget.`,
      severity: "info",
      evidence: [{ label: "Amount", value: formatINR(a.amount) }, { label: "Category avg", value: formatINR(mean(catAmounts.get(a.category) ?? [])) }],
      confidence: 0.9,
      route: "/spending",
    });
  }
  const subs = byCategory.find((c) => c.name === "Subscriptions");
  if (subs && subs.value / 3 > 1000) {
    insights.push({
      id: "subscriptions",
      type: "spending",
      title: "Subscriptions are adding up",
      body: `You're spending about ${formatINR(subs.value / 3, { compact: true })}/month on subscriptions. Audit for services you no longer use.`,
      severity: "info",
      evidence: [{ label: "3-month total", value: formatINR(subs.value) }],
      confidence: 0.7,
      route: "/spending",
    });
  }

  return {
    monthlySpend,
    avgMonthlySpend,
    byCategory,
    monthlyTrend,
    topMerchants,
    lifestyleInflation,
    anomalies,
    forecastNextMonth,
    insights,
  };
}
