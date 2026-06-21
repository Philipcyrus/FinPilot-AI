import { NextResponse } from "next/server";
import { loadFinancialPicture } from "@/lib/data";
import { simulateScenario, type ScenarioId } from "@/lib/engines/scenario";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { id, magnitude } = (await req.json()) as { id: ScenarioId; magnitude: number };
    const picture = await loadFinancialPicture();
    const result = simulateScenario(picture, { id, magnitude });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Scenario failed" }, { status: 500 });
  }
}
