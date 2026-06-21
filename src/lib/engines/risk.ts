import type { FinancialPicture } from "@/lib/types";
import { BENCHMARKS, RISK_FREE_RATE } from "@/lib/constants";
import { annualizedVol, beta, maxDrawdown, returnsFromPrices, mean } from "./math";
import { clamp } from "@/lib/utils";

export type RiskAnalysis = {
  volatility: number; // annualized %
  maxDrawdown: number; // %
  beta: number; // vs Nifty
  sharpe: number;
  stabilityScore: number; // 0-100
  riskScore: number; // 0-100 (higher = riskier)
  riskLevel: "Low" | "Moderate" | "Elevated" | "High";
  vulnerabilities: { title: string; detail: string }[];
};

/** Build a value-weighted daily return series for the equity portion of the portfolio. */
function portfolioReturns(p: FinancialPicture): number[] {
  const withPrices = p.holdings.filter((h) => p.prices[h.symbol]?.length);
  if (!withPrices.length) return [];
  const totalVal = withPrices.reduce((s, h) => s + h.value, 0) || 1;
  // Align on the shortest series length.
  const minLen = Math.min(...withPrices.map((h) => p.prices[h.symbol].length));
  const combined: number[] = new Array(minLen - 1).fill(0);
  for (const h of withPrices) {
    const closes = p.prices[h.symbol].slice(-minLen).map((d) => d.close);
    const rets = returnsFromPrices(closes);
    const w = h.value / totalVal;
    for (let i = 0; i < rets.length; i++) combined[i] += rets[i] * w;
  }
  return combined;
}

export function analyzeRisk(p: FinancialPicture): RiskAnalysis {
  const rets = portfolioReturns(p);
  const niftyPrices = (p.prices[BENCHMARKS.nifty50.symbol] ?? []).map((d) => d.close);
  const niftyRets = returnsFromPrices(niftyPrices);

  // Seed snapshots are ~weekly (every 5 days), so ~50 periods per year.
  const PPY = 50;
  const vol = annualizedVol(rets, PPY) * 100;
  const portfolioPrices = reconstructEquityCurve(p);
  const dd = maxDrawdown(portfolioPrices) * 100;
  const b = niftyRets.length ? beta(rets, niftyRets) : 1;
  const annualReturn = mean(rets) * PPY;
  const sharpe = vol > 0 ? (annualReturn - RISK_FREE_RATE) / (vol / 100) : 0;

  // Stability: lower vol & drawdown & beta near/below 1 => higher.
  const volScore = clamp(100 - (vol - 10) * 3.5, 0, 100);
  const ddScore = clamp(100 - (dd - 8) * 3, 0, 100);
  const betaScore = clamp(100 - Math.abs(b - 0.9) * 80, 0, 100);
  const stability = Math.round(0.45 * volScore + 0.35 * ddScore + 0.2 * betaScore);
  const riskScore = clamp(100 - stability, 0, 100);

  const level: RiskAnalysis["riskLevel"] =
    riskScore < 30 ? "Low" : riskScore < 50 ? "Moderate" : riskScore < 70 ? "Elevated" : "High";

  const vulnerabilities: RiskAnalysis["vulnerabilities"] = [];
  if (vol > 22) vulnerabilities.push({ title: "High volatility", detail: `Portfolio swings ~${vol.toFixed(0)}% annually, above a balanced range.` });
  if (dd > 20) vulnerabilities.push({ title: "Deep drawdown risk", detail: `Worst observed drop of ${dd.toFixed(0)}% from peak.` });
  if (b > 1.15) vulnerabilities.push({ title: "Market-sensitive", detail: `Beta of ${b.toFixed(2)} means you fall harder than the index in selloffs.` });
  const smallcap = p.holdings.filter((h) => h.marketCap === "small").reduce((s, h) => s + h.value, 0);
  const totalEq = p.holdings.filter((h) => h.assetClass === "equity").reduce((s, h) => s + h.value, 0) || 1;
  if (smallcap / totalEq > 0.15) vulnerabilities.push({ title: "Small-cap exposure", detail: "Small-caps add return but amplify drawdowns in stress." });

  return {
    volatility: vol,
    maxDrawdown: dd,
    beta: b,
    sharpe,
    stabilityScore: stability,
    riskScore,
    riskLevel: level,
    vulnerabilities,
  };
}

function reconstructEquityCurve(p: FinancialPicture): number[] {
  const withPrices = p.holdings.filter((h) => p.prices[h.symbol]?.length);
  if (!withPrices.length) return [];
  const minLen = Math.min(...withPrices.map((h) => p.prices[h.symbol].length));
  const curve: number[] = new Array(minLen).fill(0);
  for (const h of withPrices) {
    const closes = p.prices[h.symbol].slice(-minLen).map((d) => d.close);
    for (let i = 0; i < minLen; i++) curve[i] += closes[i] * h.quantity;
  }
  return curve;
}
