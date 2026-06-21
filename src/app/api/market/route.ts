import { NextResponse } from "next/server";
import { getQuote } from "@/lib/providers/equity";
import { BENCHMARKS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live snapshot of the major Indian indices for the market ticker. */
export async function GET() {
  const quotes = await Promise.all(
    Object.values(BENCHMARKS).map(async (b) => {
      const q = await getQuote(b.symbol, b.name);
      return { symbol: b.symbol, name: b.name, price: q.price, changePct: q.changePct, source: q.source };
    }),
  );
  return NextResponse.json({ indices: quotes });
}
