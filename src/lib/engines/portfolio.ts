import type { FinancialPicture, AllocationSlice, SeriesPoint } from "@/lib/types";
import { ASSET_CLASS_COLORS, ASSET_CLASS_LABEL, SECTOR_COLORS } from "@/lib/constants";
import { xirr, cagr, type CashFlow } from "./math";
import { formatMonth } from "@/lib/utils";

export type PortfolioAnalysis = {
  totalValue: number;
  totalInvested: number;
  pnl: number;
  pnlPct: number;
  xirr: number; // money-weighted annualized
  cagr: number; // approx time-weighted
  bestHolding: { name: string; pnlPct: number } | null;
  worstHolding: { name: string; pnlPct: number } | null;
  byAssetClass: AllocationSlice[];
  bySector: AllocationSlice[];
  byMarketCap: AllocationSlice[];
  history: SeriesPoint[]; // approx portfolio value over time
  cashBalance: number;
};

function toSlices(
  map: Map<string, number>,
  total: number,
  colorFor: (k: string) => string,
  labelFor?: (k: string) => string,
): AllocationSlice[] {
  return [...map.entries()]
    .map(([k, value]) => ({
      name: labelFor ? labelFor(k) : k,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
      color: colorFor(k),
    }))
    .sort((a, b) => b.value - a.value);
}

export function analyzePortfolio(p: FinancialPicture): PortfolioAnalysis {
  const holdings = p.holdings;
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
  const pnl = totalValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

  // Allocations
  const assetMap = new Map<string, number>();
  const sectorMap = new Map<string, number>();
  const capMap = new Map<string, number>();
  for (const h of holdings) {
    assetMap.set(h.assetClass, (assetMap.get(h.assetClass) ?? 0) + h.value);
    sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.value);
    const capKey = h.marketCap === "na" ? "Funds/ETF" : `${h.marketCap[0].toUpperCase()}${h.marketCap.slice(1)} Cap`;
    capMap.set(capKey, (capMap.get(capKey) ?? 0) + h.value);
  }

  // Money-weighted XIRR: each holding's cost is an outflow at an estimated entry
  // date (stocks ~1y of price history; funds accumulated via SIP ~2y), terminal
  // value is an inflow today. Avoids double-counting full SIP history vs. NAV value.
  const now = new Date();
  const yearMs = 365 * 24 * 3600 * 1000;
  const ageYears = (h: { assetClass: string }) =>
    h.assetClass === "mutual_fund" ? 2.2 : h.assetClass === "etf" ? 1.6 : 1.0;
  const flows: CashFlow[] = [];
  let weightedAge = 0;
  for (const h of holdings) {
    flows.push({ date: new Date(now.getTime() - ageYears(h) * yearMs), amount: -h.invested });
    weightedAge += ageYears(h) * h.value;
  }
  flows.push({ date: now, amount: totalValue });
  flows.sort((a, b) => a.date.getTime() - b.date.getTime());
  const xirrVal = flows.length > 2 ? xirr(flows) * 100 : pnlPct;

  // Time-weighted CAGR over the value-weighted holding horizon.
  const horizonYears = totalValue > 0 ? Math.max(0.6, weightedAge / totalValue) : 1.5;
  const cagrVal = cagr(totalInvested, totalValue, horizonYears) * 100;

  const sorted = [...holdings].sort((a, b) => b.pnlPct - a.pnlPct);
  const best = sorted[0] ? { name: sorted[0].name, pnlPct: sorted[0].pnlPct } : null;
  const worst = sorted[sorted.length - 1]
    ? { name: sorted[sorted.length - 1].name, pnlPct: sorted[sorted.length - 1].pnlPct }
    : null;

  return {
    totalValue,
    totalInvested,
    pnl,
    pnlPct,
    xirr: xirrVal,
    cagr: cagrVal,
    bestHolding: best,
    worstHolding: worst,
    byAssetClass: toSlices(assetMap, totalValue, (k) => ASSET_CLASS_COLORS[k] ?? "#94a3b8", (k) => ASSET_CLASS_LABEL[k] ?? k),
    bySector: toSlices(sectorMap, totalValue, (k) => SECTOR_COLORS[k] ?? "#94a3b8"),
    byMarketCap: toSlices(capMap, totalValue, (k) => SECTOR_COLORS[k.split(" ")[0]] ?? "#6366f1"),
    history: reconstructHistory(p),
    cashBalance: 0,
  };
}

/** Reconstruct an approximate monthly portfolio value series from price snapshots. */
function reconstructHistory(p: FinancialPicture): SeriesPoint[] {
  // Collect all snapshot dates from indices/holdings that have price history.
  const symbolWithPrices = p.holdings.filter((h) => p.prices[h.symbol]?.length);
  if (!symbolWithPrices.length) return [];

  // Use the date axis from the first holding with prices (weekly cadence from seed).
  const axis = p.prices[symbolWithPrices[0].symbol].map((d) => d.date);
  const series: SeriesPoint[] = [];
  // MFs and others without history contribute their current value flat.
  const flatValue = p.holdings
    .filter((h) => !p.prices[h.symbol]?.length)
    .reduce((s, h) => s + h.value, 0);

  // Pre-index price-by-date for each symbol.
  const priceLookup: Record<string, Map<number, number>> = {};
  for (const h of symbolWithPrices) {
    const m = new Map<number, number>();
    for (const pt of p.prices[h.symbol]) m.set(startOfDay(pt.date), pt.close);
    priceLookup[h.symbol] = m;
  }

  for (let i = 0; i < axis.length; i += 1) {
    const date = axis[i];
    const key = startOfDay(date);
    let val = flatValue;
    for (const h of symbolWithPrices) {
      const close = priceLookup[h.symbol].get(key) ?? h.currentPrice;
      val += close * h.quantity;
    }
    // Sample roughly monthly for a clean chart.
    if (i % 4 === 0 || i === axis.length - 1) {
      series.push({ label: formatMonth(date), value: Math.round(val) });
    }
  }
  return series;
}

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
