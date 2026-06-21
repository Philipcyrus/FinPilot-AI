import { NextResponse } from "next/server";
import { prisma, requireActiveUserId } from "@/lib/db";
import { classifyMerchant } from "@/lib/engines/spending";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { date: string; description: string; amount: number; category?: string };

export async function POST(req: Request) {
  try {
    const { rows } = (await req.json()) as { rows?: Row[] };
    if (!rows?.length) return NextResponse.json({ error: "No rows" }, { status: 400 });
    const userId = await requireActiveUserId();

    const data = rows
      .filter((r) => r.amount && r.date)
      .map((r) => {
        const out = r.amount < 0;
        const isSalary = /salary|payroll|income/i.test(r.description);
        return {
          userId,
          date: new Date(r.date),
          direction: out ? "out" : "in",
          type: out ? "expense" : isSalary ? "salary" : "interest",
          amount: Math.abs(r.amount),
          category: out ? r.category || classifyMerchant(r.description) : "Other",
          merchant: r.description.slice(0, 80),
        };
      })
      .filter((r) => !isNaN(r.date.getTime()));

    await prisma.transaction.createMany({ data });
    return NextResponse.json({ imported: data.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Import failed" }, { status: 500 });
  }
}
