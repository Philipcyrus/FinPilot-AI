import type { FinancialPicture } from "@/lib/types";

export type FundOverlap = {
  fundA: string;
  fundB: string;
  shared: string[];
  overlapPct: number; // Jaccard-style overlap of top holdings
};

export type OverlapAnalysis = {
  pairs: FundOverlap[];
  hiddenConcentration: { stock: string; funds: string[]; alsoDirect: boolean }[];
  summary: string;
};

/** Detect overlap between mutual funds (by seeded top-holdings) and direct equity. */
export function analyzeOverlap(p: FinancialPicture): OverlapAnalysis {
  const funds = p.holdings
    .filter((h) => h.assetClass === "mutual_fund")
    .map((h) => ({ name: h.name, symbol: h.symbol, holdings: (p.fundMeta[h.symbol]?.holdings ?? []).map((s) => s.toUpperCase()) }))
    .filter((f) => f.holdings.length);

  const pairs: FundOverlap[] = [];
  for (let i = 0; i < funds.length; i++) {
    for (let j = i + 1; j < funds.length; j++) {
      const a = funds[i];
      const b = funds[j];
      const setB = new Set(b.holdings);
      const shared = a.holdings.filter((s) => setB.has(s));
      const union = new Set([...a.holdings, ...b.holdings]).size;
      const overlapPct = union ? (shared.length / union) * 100 : 0;
      if (shared.length) pairs.push({ fundA: a.name, fundB: b.name, shared, overlapPct });
    }
  }
  pairs.sort((a, b) => b.overlapPct - a.overlapPct);

  // Hidden concentration: stocks appearing across multiple funds (and maybe held directly).
  const directSymbols = new Set(p.holdings.filter((h) => h.assetClass === "equity").map((h) => h.symbol.toUpperCase()));
  const stockFundMap = new Map<string, Set<string>>();
  for (const f of funds) for (const s of f.holdings) {
    const set = stockFundMap.get(s) ?? new Set<string>();
    set.add(f.name);
    stockFundMap.set(s, set);
  }
  const hiddenConcentration = [...stockFundMap.entries()]
    .filter(([stock, fundSet]) => fundSet.size >= 2 || directSymbols.has(stock))
    .map(([stock, fundSet]) => ({ stock, funds: [...fundSet], alsoDirect: directSymbols.has(stock) }))
    .filter((x) => x.funds.length >= 2 || (x.alsoDirect && x.funds.length >= 1))
    .sort((a, b) => b.funds.length - a.funds.length)
    .slice(0, 8);

  const worst = pairs[0];
  const summary = worst
    ? `Highest overlap is between ${worst.fundA} and ${worst.fundB} (${worst.overlapPct.toFixed(0)}% shared top holdings). ${hiddenConcentration[0] ? `${hiddenConcentration[0].stock} appears across ${hiddenConcentration[0].funds.length} funds${hiddenConcentration[0].alsoDirect ? " and is also held directly" : ""}, creating hidden concentration.` : ""}`
    : "No meaningful overlap detected between your funds.";

  return { pairs, hiddenConcentration, summary };
}
