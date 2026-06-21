import type { FinancialPicture, GoalView } from "@/lib/types";
import { EQUITY_EXPECTED_RETURN } from "@/lib/constants";
import { requiredSip, goalSuccessProbability, sipFutureValue } from "./math";
import { yearsBetween } from "@/lib/utils";

export type GoalAnalysis = {
  goal: GoalView;
  progressPct: number;
  yearsLeft: number;
  projectedValue: number; // with current contribution
  requiredMonthly: number; // to hit target
  contributionGap: number;
  successProbability: number;
  onTrack: boolean;
  status: "on-track" | "at-risk" | "off-track";
};

export function analyzeGoal(goal: GoalView, expectedReturn = EQUITY_EXPECTED_RETURN): GoalAnalysis {
  const now = new Date();
  const yearsLeft = Math.max(0, yearsBetween(now, new Date(goal.targetDate)));
  const progressPct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  const r = goal.type === "emergency" ? 0.06 : expectedReturn; // EF in safer assets
  const vol = goal.type === "emergency" ? 0.02 : goal.type === "retirement" ? 0.15 : 0.12;

  const projectedValue = goal.currentAmount * (1 + r) ** yearsLeft + sipFutureValue(goal.monthlyContribution, r, yearsLeft);
  const requiredMonthly = requiredSip(goal.targetAmount, r, yearsLeft, goal.currentAmount);
  const contributionGap = Math.max(0, requiredMonthly - goal.monthlyContribution);
  const successProbability = goalSuccessProbability(goal.currentAmount, goal.monthlyContribution, yearsLeft, goal.targetAmount, r, vol);

  const onTrack = projectedValue >= goal.targetAmount * 0.95;
  const status: GoalAnalysis["status"] = successProbability >= 0.7 ? "on-track" : successProbability >= 0.45 ? "at-risk" : "off-track";

  return { goal, progressPct, yearsLeft, projectedValue, requiredMonthly, contributionGap, successProbability, onTrack, status };
}

export function analyzeGoals(p: FinancialPicture): GoalAnalysis[] {
  return p.goals.map((g) => analyzeGoal(g));
}
