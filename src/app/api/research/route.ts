import { NextResponse } from "next/server";
import { runResearch } from "@/lib/ai/research";
import type { ResearchMode } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query, mode } = (await req.json()) as { query?: string; mode?: ResearchMode };
    if (!query || !query.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });
    const report = await runResearch(query.trim(), mode ?? "standard");
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Research failed" }, { status: 500 });
  }
}
