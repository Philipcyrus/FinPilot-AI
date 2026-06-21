import "server-only";
import { prisma, parseJson, requireActiveUserId } from "@/lib/db";
import type { FinancialPicture, HoldingView } from "@/lib/types";

/** Loads the full financial picture for the active demo user. Cached per request. */
export async function loadFinancialPicture(): Promise<FinancialPicture> {
  const userId = await requireActiveUserId();
  const [user, holdings, transactions, goals, sips, instruments] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.holding.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { priority: "asc" } }),
    prisma.sIP.findMany({ where: { userId } }),
    prisma.instrument.findMany({ include: { prices: { orderBy: { date: "asc" } } } }),
  ]);

  const holdingViews: HoldingView[] = holdings.map((h) => {
    const invested = h.quantity * h.avgCost;
    const value = h.quantity * h.currentPrice;
    const pnl = value - invested;
    return {
      id: h.id,
      symbol: h.symbol,
      name: h.name,
      assetClass: h.assetClass,
      sector: h.sector,
      marketCap: h.marketCap,
      quantity: h.quantity,
      avgCost: h.avgCost,
      currentPrice: h.currentPrice,
      invested,
      value,
      pnl,
      pnlPct: invested > 0 ? (pnl / invested) * 100 : 0,
    };
  });

  const prices: Record<string, { date: Date; close: number }[]> = {};
  const fundMeta: FinancialPicture["fundMeta"] = {};
  for (const inst of instruments) {
    prices[inst.symbol] = inst.prices.map((p) => ({ date: p.date, close: p.close }));
    if (inst.type === "mf") {
      fundMeta[inst.symbol] = parseJson(inst.meta, {});
    }
  }

  return {
    user: { id: user.id, name: user.name, monthlyIncome: user.monthlyIncome, riskProfile: user.riskProfile },
    holdings: holdingViews,
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date,
      direction: t.direction,
      type: t.type,
      amount: t.amount,
      category: t.category,
      merchant: t.merchant,
      symbol: t.symbol,
    })),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate,
      monthlyContribution: g.monthlyContribution,
      priority: g.priority,
    })),
    sips: sips.map((s) => ({
      id: s.id,
      name: s.name,
      symbol: s.symbol,
      amount: s.amount,
      frequency: s.frequency,
      startDate: s.startDate,
      goalId: s.goalId,
    })),
    prices,
    fundMeta,
  };
}
