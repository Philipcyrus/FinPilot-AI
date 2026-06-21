import type { RecommendationItem, FinancialPicture } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import type { SavingsAnalysis } from "./savings";
import type { SpendingAnalysis } from "./spending";
import type { PortfolioHealth } from "./portfolioHealth";
import type { GoalAnalysis } from "./goals";
import type { RiskAnalysis } from "./risk";
import type { SipAnalysis } from "./sip";
import type { OverlapAnalysis } from "./overlap";

export function generateRecommendations(args: {
  picture: FinancialPicture;
  savings: SavingsAnalysis;
  spending: SpendingAnalysis;
  portfolioHealth: PortfolioHealth;
  goals: GoalAnalysis[];
  risk: RiskAnalysis;
  sip: SipAnalysis;
  overlap: OverlapAnalysis;
}): RecommendationItem[] {
  const { picture, savings, spending, portfolioHealth, goals, risk, sip, overlap } = args;
  const recs: RecommendationItem[] = [];

  // Emergency fund
  if (savings.emergencyMonths < 6) {
    const gap = Math.round((6 - savings.emergencyMonths) * savings.avgExpense);
    recs.push({
      id: "emergency-fund",
      title: "Strengthen your emergency fund",
      explanation: `You have ${savings.emergencyMonths.toFixed(1)} months of expenses set aside. A 6-month buffer protects your investments from forced selling during income shocks.`,
      evidence: [
        { label: "Current buffer", value: `${savings.emergencyMonths.toFixed(1)} months` },
        { label: "Gap to 6 months", value: formatINR(gap, { compact: true }) },
      ],
      confidence: 0.88,
      riskLevel: "low",
      impact: savings.emergencyMonths < 3 ? "high" : "medium",
      alternatives: ["Park the gap in a liquid fund or sweep-FD for better yield than savings.", "Redirect one month's discretionary surplus until the buffer is full."],
      category: "savings",
    });
  }

  // Concentration / diversification
  if (portfolioHealth.largestPositionPct > 15) {
    const top = [...picture.holdings].sort((a, b) => b.value - a.value)[0];
    recs.push({
      id: "reduce-concentration",
      title: "Trim your largest position",
      explanation: `${top.name} is ${portfolioHealth.largestPositionPct.toFixed(0)}% of your portfolio. Reducing it toward 10–12% lowers single-stock risk without sacrificing much upside.`,
      evidence: [
        { label: top.name, value: `${portfolioHealth.largestPositionPct.toFixed(0)}%` },
        { label: "Portfolio HHI", value: portfolioHealth.concentration.toFixed(3) },
      ],
      confidence: 0.8,
      riskLevel: "low",
      impact: "medium",
      alternatives: ["Redirect future SIPs away from this name instead of selling (tax-friendly).", "Set a rule to rebalance whenever any position exceeds 15%."],
      category: "portfolio",
    });
  }

  // SIP overlap consolidation
  if (overlap.pairs[0] && overlap.pairs[0].overlapPct > 25) {
    recs.push({
      id: "consolidate-funds",
      title: "Consolidate overlapping funds",
      explanation: `${overlap.pairs[0].fundA} and ${overlap.pairs[0].fundB} overlap ${overlap.pairs[0].overlapPct.toFixed(0)}%. Two similar funds add cost and complexity without extra diversification.`,
      evidence: [{ label: "Overlap", value: `${overlap.pairs[0].overlapPct.toFixed(0)}%` }, { label: "Shared", value: overlap.pairs[0].shared.slice(0, 4).join(", ") }],
      confidence: 0.75,
      riskLevel: "low",
      impact: "medium",
      alternatives: ["Keep the lower-expense fund and stop the other's SIP.", "Replace one with a different category (e.g. an index or international fund)."],
      category: "funds",
    });
  }

  // Increase SIP
  if (!sip.adequacy.investingEnough) {
    recs.push({
      id: "increase-sip",
      title: "Step up your monthly investing",
      explanation: `You invest ${formatINR(sip.totalMonthly, { compact: true })}/month (${((sip.totalMonthly / picture.user.monthlyIncome) * 100).toFixed(0)}% of income). Raising it toward 25% would materially accelerate your house and retirement goals.`,
      evidence: [{ label: "Current", value: formatINR(sip.totalMonthly) }, { label: "Suggested", value: formatINR(sip.adequacy.recommendedMonthly) }],
      confidence: 0.72,
      riskLevel: "low",
      impact: "high",
      alternatives: ["Automate an annual 10% SIP step-up to keep pace with income.", "Funnel any salary raise straight into SIPs."],
      category: "sip",
    });
  }

  // Goal at risk
  const atRisk = goals.filter((g) => g.status !== "on-track").sort((a, b) => a.successProbability - b.successProbability)[0];
  if (atRisk) {
    recs.push({
      id: `goal-${atRisk.goal.id}`,
      title: `Boost contributions to "${atRisk.goal.name}"`,
      explanation: `At ${(atRisk.successProbability * 100).toFixed(0)}% success probability, this goal needs about ${formatINR(atRisk.requiredMonthly, { compact: true })}/month vs your current ${formatINR(atRisk.goal.monthlyContribution, { compact: true })}.`,
      evidence: [
        { label: "Success prob.", value: `${(atRisk.successProbability * 100).toFixed(0)}%` },
        { label: "Monthly gap", value: formatINR(atRisk.contributionGap, { compact: true }) },
      ],
      confidence: 0.7,
      riskLevel: "low",
      impact: "high",
      alternatives: ["Extend the timeline by a year if the contribution gap is too large.", "Reduce the target, or split it into phases."],
      category: "goals",
    });
  }

  // Reduce wasteful spend
  if (spending.lifestyleInflation > 8) {
    recs.push({
      id: "spending-cap",
      title: "Cap discretionary spending growth",
      explanation: `Your spending rose ${spending.lifestyleInflation.toFixed(0)}% recently. Setting a monthly cap on Shopping/Food keeps your savings rate intact as income grows.`,
      evidence: [{ label: "Spend growth", value: `${spending.lifestyleInflation.toFixed(0)}%` }, { label: "Monthly spend", value: formatINR(spending.monthlySpend, { compact: true }) }],
      confidence: 0.68,
      riskLevel: "low",
      impact: "medium",
      alternatives: ["Use a 50/30/20 budget guardrail.", "Pre-commit the next raise to investing before lifestyle adjusts."],
      category: "spending",
    });
  }

  // Risk note
  if (risk.riskLevel === "Elevated" || risk.riskLevel === "High") {
    recs.push({
      id: "rebalance-risk",
      title: "Rebalance toward your risk comfort",
      explanation: `Portfolio risk is ${risk.riskLevel.toLowerCase()} (beta ${risk.beta.toFixed(2)}, vol ${risk.volatility.toFixed(0)}%). Adding stability (large-caps, debt, gold) would smooth the ride for a balanced investor.`,
      evidence: [{ label: "Volatility", value: `${risk.volatility.toFixed(0)}%` }, { label: "Max drawdown", value: `${risk.maxDrawdown.toFixed(0)}%` }],
      confidence: 0.7,
      riskLevel: "medium",
      impact: "medium",
      alternatives: ["Shift incremental SIPs to a large-cap/index fund.", "Add a small debt allocation as ballast."],
      category: "risk",
    });
  }

  // Rank by impact then confidence.
  const impactRank = { high: 3, medium: 2, low: 1 };
  return recs.sort((a, b) => impactRank[b.impact] - impactRank[a.impact] || b.confidence - a.confidence);
}
