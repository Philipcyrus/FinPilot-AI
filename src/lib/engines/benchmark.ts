import type { FinancialPicture, SeriesPoint } from "@/lib/types";
import { BENCHMARKS } from "@/lib/constants";
import { cagr, returnsFromPrices, annualizedVol } from "./math";
import { formatMonth } from "@/lib/utils";

export type BenchmarkAnalysis = {
  portfolioReturn: number; // % over window
  benchmarks: { name: string; symbol: string; return: number; alpha: number }[];
  relativeRiskNote: string;
  comparison: SeriesPoint[]; // normalized to 100
};

function equityCurve(p: FinancialPicture): { date: Date; value: number }[] {
  const withPrices = p.holdings.filter((h) => p.prices[h.symbol]?.length);
  if (!withPrices.length) return [];
  const minLen = Math.min(...withPrices.map((h) => p.prices[h.symbol].length));
  const dates = p.prices[withPrices[0].symbol].slice(-minLen).map((d) => d.date);
  const curve = dates.map((date, i) => {
    let v = 0;
    for (const h of withPrices) {
      const series = p.prices[h.symbol].slice(-minLen);
      v += series[i].close * h.quantity;
    }
    return { date, value: v };
  });
  return curve;
}

export function analyzeBenchmark(p: FinancialPicture): BenchmarkAnalysis {
  const curve = equityCurve(p);
  if (curve.length < 2) {
    return { portfolioReturn: 0, benchmarks: [], relativeRiskNote: "Insufficient price history.", comparison: [] };
  }
  const years = (curve[curve.length - 1].date.getTime() - curve[0].date.getTime()) / (365 * 24 * 3600 * 1000);
  const PPY = 50; // weekly-ish snapshots
  const portReturn = cagr(curve[0].value, curve[curve.length - 1].value, years) * 100;
  const portVol = annualizedVol(returnsFromPrices(curve.map((c) => c.value)), PPY) * 100;

  const benchmarks = Object.values(BENCHMARKS)
    .map((b) => {
      const series = p.prices[b.symbol];
      if (!series?.length) return null;
      const bRet = cagr(series[0].close, series[series.length - 1].close, years) * 100;
      return { name: b.name, symbol: b.symbol, return: bRet, alpha: portReturn - bRet };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  // Normalized comparison chart (base 100) vs Nifty.
  const nifty = p.prices[BENCHMARKS.nifty50.symbol] ?? [];
  const minLen = Math.min(curve.length, nifty.length);
  const comparison: SeriesPoint[] = [];
  const p0 = curve[curve.length - minLen].value;
  const n0 = nifty[nifty.length - minLen].close;
  for (let i = 0; i < minLen; i += Math.max(1, Math.floor(minLen / 30))) {
    const ci = curve.length - minLen + i;
    const ni = nifty.length - minLen + i;
    comparison.push({
      label: formatMonth(curve[ci].date),
      Portfolio: Math.round((curve[ci].value / p0) * 100),
      Nifty50: Math.round((nifty[ni].close / n0) * 100),
      value: Math.round((curve[ci].value / p0) * 100),
    });
  }

  const niftyVol = annualizedVol(returnsFromPrices(nifty.map((d) => d.close)), PPY) * 100;
  const relativeRiskNote =
    portVol > niftyVol * 1.1
      ? `Your portfolio is ~${((portVol / niftyVol - 1) * 100).toFixed(0)}% more volatile than the Nifty 50 — you're taking extra risk for these returns.`
      : `Your portfolio's volatility (${portVol.toFixed(0)}%) is in line with the Nifty 50 (${niftyVol.toFixed(0)}%).`;

  return { portfolioReturn: portReturn, benchmarks, relativeRiskNote, comparison };
}
