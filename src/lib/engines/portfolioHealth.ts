import type { FinancialPicture, ScoreResult, SubScore } from "@/lib/types";
import { hhi } from "./math";
import { scoreLabel, formatPercent } from "@/lib/utils";
import type { RiskAnalysis } from "./risk";

export type PortfolioHealth = ScoreResult & {
  concentration: number; // HHI 0-1
  largestPositionPct: number;
};

export function analyzePortfolioHealth(p: FinancialPicture, risk: RiskAnalysis): PortfolioHealth {
  const total = p.holdings.reduce((s, h) => s + h.value, 0) || 1;
  const weights = p.holdings.map((h) => h.value / total);
  const concentration = hhi(weights);
  const largest = Math.max(...weights, 0);

  // Diversification: more effective holdings = better. Effective N = 1/HHI.
  const effectiveN = concentration > 0 ? 1 / concentration : 0;
  const diversification = clamp(((effectiveN - 1) / 11) * 100, 0, 100);

  // Concentration penalty for any single oversized position.
  const concentrationScore = clamp(100 - Math.max(0, largest - 0.15) * 400, 0, 100);

  // Asset-class spread
  const assetClasses = new Set(p.holdings.map((h) => h.assetClass));
  const assetSpread = clamp((assetClasses.size / 4) * 100, 0, 100);

  // Sector spread
  const sectorVals = new Map<string, number>();
  for (const h of p.holdings) if (h.assetClass === "equity") sectorVals.set(h.sector, (sectorVals.get(h.sector) ?? 0) + h.value);
  const sectorWeights = [...sectorVals.values()].map((v) => v / ([...sectorVals.values()].reduce((a, b) => a + b, 0) || 1));
  const sectorScore = clamp(100 - (hhi(sectorWeights) - 0.2) * 250, 0, 100);

  // Liquidity: equity/MF/ETF are liquid; assume all liquid here.
  const liquidScore = 90;

  // Risk alignment from risk engine.
  const riskScore = risk.stabilityScore;

  const subScores: SubScore[] = [
    { key: "diversification", label: "Diversification", score: Math.round(diversification), weight: 0.25, detail: `Effective ${effectiveN.toFixed(1)} independent positions across ${p.holdings.length} holdings.` },
    { key: "concentration", label: "Concentration", score: Math.round(concentrationScore), weight: 0.2, detail: `Largest single position is ${formatPercent(largest * 100, 0)} of the portfolio.` },
    { key: "sector", label: "Sector Balance", score: Math.round(sectorScore), weight: 0.2, detail: `Equity sector spread across ${sectorVals.size} sectors.` },
    { key: "asset", label: "Asset Mix", score: Math.round(assetSpread), weight: 0.15, detail: `${assetClasses.size} asset classes used (stocks, funds, ETF, gold...).` },
    { key: "risk", label: "Risk & Stability", score: Math.round(riskScore), weight: 0.15, detail: `Stability score ${risk.stabilityScore}/100, beta ${risk.beta.toFixed(2)}.` },
    { key: "liquidity", label: "Liquidity", score: liquidScore, weight: 0.05, detail: "Holdings are readily redeemable." },
  ];

  const score = Math.round(subScores.reduce((s, x) => s + x.score * x.weight, 0));

  return {
    score,
    label: scoreLabel(score),
    summary:
      score >= 70
        ? "Well-structured portfolio with healthy diversification and controlled concentration."
        : score >= 50
          ? "Reasonable structure, but a few positions or sectors dominate — trimming would improve resilience."
          : "Concentration and limited spread are weighing on portfolio health. Diversification should be a priority.",
    subScores,
    evidence: [
      { label: "Concentration (HHI)", value: concentration.toFixed(3), detail: "Lower is more diversified" },
      { label: "Largest position", value: formatPercent(largest * 100, 0) },
      { label: "Effective holdings", value: effectiveN.toFixed(1) },
    ],
    concentration,
    largestPositionPct: largest * 100,
  };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
