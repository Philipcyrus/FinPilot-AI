import type { FinancialPicture, InsightItem } from "@/lib/types";
import { analyzePortfolio, type PortfolioAnalysis } from "./portfolio";
import { analyzeRisk, type RiskAnalysis } from "./risk";
import { analyzePortfolioHealth, type PortfolioHealth } from "./portfolioHealth";
import { analyzeSpending, type SpendingAnalysis } from "./spending";
import { analyzeSavings, type SavingsAnalysis } from "./savings";
import { analyzeOverlap, type OverlapAnalysis } from "./overlap";
import { analyzeSip, type SipAnalysis } from "./sip";
import { analyzeBenchmark, type BenchmarkAnalysis } from "./benchmark";
import { analyzeGoals, type GoalAnalysis } from "./goals";
import { analyzeBehavior, type BehavioralAnalysis } from "./behavioral";
import { analyzeFinancialHealth } from "./health";
import { generateRecommendations } from "./recommendations";
import type { ScoreResult, RecommendationItem } from "@/lib/types";

export type Dashboard = {
  picture: FinancialPicture;
  portfolio: PortfolioAnalysis;
  risk: RiskAnalysis;
  portfolioHealth: PortfolioHealth;
  spending: SpendingAnalysis;
  savings: SavingsAnalysis;
  overlap: OverlapAnalysis;
  sip: SipAnalysis;
  benchmark: BenchmarkAnalysis;
  goals: GoalAnalysis[];
  behavioral: BehavioralAnalysis;
  financialHealth: ScoreResult;
  recommendations: RecommendationItem[];
  insights: InsightItem[];
  netWorth: number;
};

/** Runs the full deterministic engine suite over a financial picture. */
export function computeDashboard(picture: FinancialPicture, emergencyFundBalance: number): Dashboard {
  const portfolio = analyzePortfolio(picture);
  const risk = analyzeRisk(picture);
  const portfolioHealth = analyzePortfolioHealth(picture, risk);
  const spending = analyzeSpending(picture);
  const savings = analyzeSavings(picture, emergencyFundBalance);
  const overlap = analyzeOverlap(picture);
  const sip = analyzeSip(picture);
  const benchmark = analyzeBenchmark(picture);
  const goals = analyzeGoals(picture);
  const behavioral = analyzeBehavior(picture);

  const financialHealth = analyzeFinancialHealth({ savings, spending, portfolioHealth, goals, risk });
  const recommendations = generateRecommendations({ picture, savings, spending, portfolioHealth, goals, risk, sip, overlap });

  const insights = dedupeInsights([
    ...spending.insights,
    ...sip.insights,
    ...behavioral.insights,
    ...goalInsights(goals),
  ]);

  const netWorth = portfolio.totalValue + emergencyFundBalance;

  return {
    picture,
    portfolio,
    risk,
    portfolioHealth,
    spending,
    savings,
    overlap,
    sip,
    benchmark,
    goals,
    behavioral,
    financialHealth,
    recommendations,
    insights,
    netWorth,
  };
}

function goalInsights(goals: GoalAnalysis[]): InsightItem[] {
  const out: InsightItem[] = [];
  for (const g of goals) {
    if (g.status === "off-track") {
      out.push({
        id: `goal-${g.goal.id}`,
        type: "goal",
        title: `"${g.goal.name}" is off track`,
        body: `On your current plan there's a ${(g.successProbability * 100).toFixed(0)}% chance of reaching this goal by ${new Date(g.goal.targetDate).getFullYear()}. Increasing the monthly contribution or extending the timeline would help.`,
        severity: "warning",
        evidence: [{ label: "Success prob.", value: `${(g.successProbability * 100).toFixed(0)}%` }],
        confidence: 0.7,
        route: "/goals",
      });
    }
  }
  return out;
}

function dedupeInsights(items: InsightItem[]): InsightItem[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}

export * from "./portfolio";
export * from "./risk";
export * from "./portfolioHealth";
export * from "./spending";
export * from "./savings";
export * from "./overlap";
export * from "./sip";
export * from "./benchmark";
export * from "./goals";
export * from "./behavioral";
export * from "./scenario";
