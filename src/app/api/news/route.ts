import { NextResponse } from "next/server";
import { getNews } from "@/lib/providers/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "Indian stock market";
  const news = await getNews(q, 16);
  return NextResponse.json({ query: q, items: news });
}
