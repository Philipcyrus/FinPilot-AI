import { NextResponse } from "next/server";
import { chatReply } from "@/lib/ai/chat";
import type { ChatMessage } from "@/lib/ai/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages?: ChatMessage[] };
    if (!messages?.length) return NextResponse.json({ error: "messages required" }, { status: 400 });
    const result = await chatReply(messages);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Chat failed" }, { status: 500 });
  }
}
