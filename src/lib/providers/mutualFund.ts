import "server-only";
import { fetchJson, cached } from "./http";
import { prisma, parseJson } from "@/lib/db";
import type { FundInfo, DataSource } from "./types";

type MfApi = {
  meta: { scheme_name: string; scheme_category: string; fund_house: string };
  data: { date: string; nav: string }[];
};

function parseNavDate(d: string): number {
  const [dd, mm, yyyy] = d.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd).getTime();
}

/** Live MF NAV + history via mfapi.in (free, no key), falling back to seeded meta. */
export async function getFund(schemeCode: string, name?: string): Promise<FundInfo> {
  try {
    return await cached(`fund:${schemeCode}`, 30 * 60_000, async () => {
      const data = await fetchJson<MfApi>(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`, { timeoutMs: 6000 });
      if (!data.data?.length) throw new Error("no nav");
      const sorted = [...data.data].sort((a, b) => parseNavDate(a.date) - parseNavDate(b.date));
      const latest = sorted[sorted.length - 1];
      const nav = parseFloat(latest.nav);
      const navByOffset = (days: number) => {
        const target = parseNavDate(latest.date) - days * 24 * 3600 * 1000;
        let best = sorted[0];
        for (const p of sorted) if (parseNavDate(p.date) <= target) best = p;
        return parseFloat(best.nav);
      };
      const ret = (days: number, label: string) => ({ period: label, value: ((nav - navByOffset(days)) / navByOffset(days)) * 100 });
      return {
        schemeCode,
        name: name ?? data.meta.scheme_name,
        category: data.meta.scheme_category ?? "Mutual Fund",
        nav,
        navDate: latest.date,
        returns: [ret(30, "1M"), ret(180, "6M"), ret(365, "1Y"), ret(1095, "3Y")],
        source: "live" as DataSource,
        history: sorted.filter((_, i) => i % 7 === 0).map((p) => ({ date: p.date, nav: parseFloat(p.nav) })),
      };
    });
  } catch {
    return fallbackFund(schemeCode, name);
  }
}

async function fallbackFund(schemeCode: string, name?: string): Promise<FundInfo> {
  const inst = await prisma.instrument.findUnique({ where: { symbol: schemeCode } });
  const meta = inst ? parseJson<{ nav?: number; style?: string; expense?: number }>(inst.meta, {}) : {};
  const nav = meta.nav ?? 100;
  return {
    schemeCode,
    name: name ?? inst?.name ?? `Scheme ${schemeCode}`,
    category: meta.style ?? inst?.sector ?? "Mutual Fund",
    nav,
    navDate: "—",
    returns: [
      { period: "1Y", value: 14 },
      { period: "3Y", value: 17 },
    ],
    source: "demo",
    history: [],
  };
}

type MfSearch = { schemeCode: number; schemeName: string }[];

export async function searchFund(q: string): Promise<{ schemeCode: string; name: string }[]> {
  try {
    const data = await fetchJson<MfSearch>(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`, { timeoutMs: 5000 });
    return data.slice(0, 10).map((x) => ({ schemeCode: String(x.schemeCode), name: x.schemeName }));
  } catch {
    return [];
  }
}
