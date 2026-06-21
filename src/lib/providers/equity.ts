import "server-only";
import { fetchJson, cached } from "./http";
import { prisma } from "@/lib/db";
import type { Quote, DataSource } from "./types";

type YahooChart = {
  chart: {
    result?: Array<{
      meta: { regularMarketPrice: number; chartPreviousClose: number; currency: string; symbol: string; longName?: string; shortName?: string };
      timestamp?: number[];
      indicators: { quote: Array<{ close: (number | null)[] }> };
    }>;
    error?: unknown;
  };
};

function yahooSymbol(symbol: string): string {
  if (symbol.startsWith("^")) return symbol; // index
  if (/\.(NS|BO)$/.test(symbol)) return symbol;
  return `${symbol}.NS`;
}

/** Live equity quote + 1y history via Yahoo Finance, falling back to seeded prices. */
export async function getQuote(symbol: string, name?: string): Promise<Quote> {
  try {
    return await cached(`quote:${symbol}`, 5 * 60_000, async () => {
      const ys = yahooSymbol(symbol);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ys)}?range=1y&interval=1d`;
      const data = await fetchJson<YahooChart>(url, { timeoutMs: 6000 });
      const r = data.chart.result?.[0];
      if (!r) throw new Error("no result");
      const closes = (r.indicators.quote[0]?.close ?? []).filter((c): c is number => c != null);
      const ts = r.timestamp ?? [];
      const history = ts
        .map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: r.indicators.quote[0]?.close?.[i] }))
        .filter((x): x is { date: string; close: number } => x.close != null);
      const price = r.meta.regularMarketPrice ?? closes[closes.length - 1];
      const prev = r.meta.chartPreviousClose ?? closes[closes.length - 2] ?? price;
      return {
        symbol,
        name: name ?? r.meta.longName ?? r.meta.shortName ?? symbol,
        price,
        changePct: prev ? ((price - prev) / prev) * 100 : 0,
        currency: r.meta.currency ?? "INR",
        source: "live" as DataSource,
        history,
        meta: { yahooSymbol: ys },
      };
    });
  } catch {
    return fallbackQuote(symbol, name);
  }
}

async function fallbackQuote(symbol: string, name?: string): Promise<Quote> {
  const inst = await prisma.instrument.findUnique({ where: { symbol }, include: { prices: { orderBy: { date: "asc" } } } });
  if (inst && inst.prices.length) {
    const closes = inst.prices.map((p) => p.close);
    const price = closes[closes.length - 1];
    const prev = closes[closes.length - 2] ?? price;
    return {
      symbol,
      name: name ?? inst.name,
      price,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      currency: "INR",
      source: "demo",
      history: inst.prices.map((p) => ({ date: p.date.toISOString().slice(0, 10), close: p.close })),
    };
  }
  // Also try a holding record for at least a current price.
  const holding = await prisma.holding.findFirst({ where: { symbol } });
  return {
    symbol,
    name: name ?? holding?.name ?? symbol,
    price: holding?.currentPrice ?? 0,
    changePct: 0,
    currency: "INR",
    source: "demo",
    history: [],
  };
}

type YahooSearch = { quotes?: Array<{ symbol: string; shortname?: string; longname?: string; quoteType?: string; exchange?: string }> };

export async function searchEquity(q: string): Promise<{ symbol: string; name: string; type: string }[]> {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const data = await fetchJson<YahooSearch>(url, { timeoutMs: 5000 });
    return (data.quotes ?? [])
      .filter((x) => x.symbol)
      .map((x) => ({ symbol: x.symbol.replace(/\.(NS|BO)$/, ""), name: x.longname ?? x.shortname ?? x.symbol, type: x.quoteType ?? "stock" }));
  } catch {
    return [];
  }
}
