import type { FinancialPicture, SeriesPoint } from "@/lib/types";
import { mean, stdev } from "./math";
import { formatMonth } from "@/lib/utils";

export type SavingsAnalysis = {
  avgIncome: number;
  avgExpense: number;
  avgInvested: number;
  savingsRate: number; // % of income saved+invested
  emergencyFund: number;
  emergencyMonths: number;
  consistency: number; // 0-100
  trend: SeriesPoint[]; // income vs spend vs saved
  surplus: number;
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function analyzeSavings(p: FinancialPicture, emergencyFundBalance: number): SavingsAnalysis {
  const income = new Map<string, number>();
  const expense = new Map<string, number>();
  const invested = new Map<string, number>();
  for (const t of p.transactions) {
    const k = monthKey(t.date);
    if (t.direction === "in" && (t.type === "salary" || t.type === "interest")) income.set(k, (income.get(k) ?? 0) + t.amount);
    else if (t.direction === "out" && t.type === "expense") expense.set(k, (expense.get(k) ?? 0) + t.amount);
    else if (t.direction === "out" && t.type === "sip") invested.set(k, (invested.get(k) ?? 0) + t.amount);
  }
  const months = [...new Set([...income.keys(), ...expense.keys()])].sort();

  const trend: SeriesPoint[] = months.map((m) => {
    const [y, mo] = m.split("-").map(Number);
    const inc = income.get(m) ?? 0;
    const exp = expense.get(m) ?? 0;
    const inv = invested.get(m) ?? 0;
    return { label: formatMonth(new Date(y, mo - 1, 1)), income: Math.round(inc), spend: Math.round(exp), saved: Math.round(Math.max(0, inc - exp)), invested: Math.round(inv) };
  });

  const avgIncome = mean(months.map((m) => income.get(m) ?? 0));
  const avgExpense = mean(months.map((m) => expense.get(m) ?? 0));
  const avgInvested = mean(months.map((m) => invested.get(m) ?? 0));
  const saved = Math.max(0, avgIncome - avgExpense);
  const savingsRate = avgIncome > 0 ? (saved / avgIncome) * 100 : 0;

  const monthlyExpenseForEF = avgExpense + avgInvested * 0; // EF covers living expenses only
  const emergencyMonths = monthlyExpenseForEF > 0 ? emergencyFundBalance / monthlyExpenseForEF : 0;

  // Consistency: how stable is the monthly surplus.
  const surpluses = months.map((m) => (income.get(m) ?? 0) - (expense.get(m) ?? 0));
  const cv = mean(surpluses) > 0 ? stdev(surpluses) / mean(surpluses) : 1;
  const consistency = Math.round(Math.max(0, Math.min(100, 100 - cv * 100)));

  return {
    avgIncome,
    avgExpense,
    avgInvested,
    savingsRate,
    emergencyFund: emergencyFundBalance,
    emergencyMonths,
    consistency,
    trend,
    surplus: saved,
  };
}
