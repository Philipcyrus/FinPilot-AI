import type { ScoreResult, SubScore } from "@/lib/types";
import { scoreLabel, clamp } from "@/lib/utils";
import type { SavingsAnalysis } from "./savings";
import type { SpendingAnalysis } from "./spending";
import type { PortfolioHealth } from "./portfolioHealth";
import type { GoalAnalysis } from "./goals";
import type { RiskAnalysis } from "./risk";

/** Composite Financial Health Score (0-100) — the headline number. */
export function analyzeFinancialHealth(args: {
  savings: SavingsAnalysis;
  spending: SpendingAnalysis;
  portfolioHealth: PortfolioHealth;
  goals: GoalAnalysis[];
  risk: RiskAnalysis;
}): ScoreResult {
  const { savings, spending, portfolioHealth, goals, risk } = args;

  // 1. Savings quality (rate vs 20% benchmark)
  const savingsQuality = clamp((savings.savingsRate / 30) * 100, 0, 100);
  // 2. Emergency fund (6 months = full)
  const efScore = clamp((savings.emergencyMonths / 6) * 100, 0, 100);
  // 3. Spending discipline (penalize lifestyle inflation)
  const disciplineScore = clamp(100 - Math.max(0, spending.lifestyleInflation) * 3, 30, 100);
  // 4. Goal progress (avg success probability)
  const goalScore = goals.length ? clamp((goals.reduce((s, g) => s + g.successProbability, 0) / goals.length) * 100, 0, 100) : 60;
  // 5. Diversification (from portfolio health)
  const divScore = portfolioHealth.score;
  // 6. Risk exposure (stability)
  const riskScore = risk.stabilityScore;
  // 7. Liquidity (emergency months as proxy for accessible cash)
  const liquidityScore = clamp((savings.emergencyMonths / 4) * 100, 20, 100);

  const subScores: SubScore[] = [
    { key: "savings", label: "Savings Quality", score: Math.round(savingsQuality), weight: 0.2, detail: `Saving ${savings.savingsRate.toFixed(0)}% of income (benchmark 20%+).` },
    { key: "emergency", label: "Emergency Fund", score: Math.round(efScore), weight: 0.18, detail: `${savings.emergencyMonths.toFixed(1)} months of expenses covered (target 6).` },
    { key: "discipline", label: "Spending Discipline", score: Math.round(disciplineScore), weight: 0.15, detail: spending.lifestyleInflation > 5 ? `Spend rising ${spending.lifestyleInflation.toFixed(0)}% — watch lifestyle creep.` : "Spending is well controlled." },
    { key: "goals", label: "Goal Progress", score: Math.round(goalScore), weight: 0.17, detail: `Avg ${(goalScore).toFixed(0)}% probability of hitting your goals on current plan.` },
    { key: "diversification", label: "Diversification", score: Math.round(divScore), weight: 0.15, detail: portfolioHealth.summary.split(".")[0] + "." },
    { key: "risk", label: "Risk & Liquidity", score: Math.round((riskScore + liquidityScore) / 2), weight: 0.15, detail: `Portfolio stability ${risk.stabilityScore}/100; liquidity comfortable.` },
  ];

  const score = Math.round(subScores.reduce((s, x) => s + x.score * x.weight, 0));
  const weakest = [...subScores].sort((a, b) => a.score - b.score)[0];

  return {
    score,
    label: scoreLabel(score),
    summary:
      score >= 75
        ? "Your financial life is in strong shape — disciplined saving, a solid buffer, and goals on track."
        : score >= 55
          ? `You're in decent shape overall. Your biggest opportunity is ${weakest.label.toLowerCase()}.`
          : `There's meaningful room to improve, starting with ${weakest.label.toLowerCase()}.`,
    subScores,
    evidence: [
      { label: "Savings rate", value: `${savings.savingsRate.toFixed(0)}%` },
      { label: "Emergency fund", value: `${savings.emergencyMonths.toFixed(1)} months` },
      { label: "Weakest area", value: weakest.label },
    ],
  };
}
