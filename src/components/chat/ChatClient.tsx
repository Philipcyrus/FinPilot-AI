"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/lib/ai/llm";
import { Sparkles, Send, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "How healthy are my finances?",
  "Am I taking too much risk?",
  "Can I afford my house goal?",
  "Where am I overspending?",
  "Are my SIPs overlapping?",
];

export function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setSource(data.source ?? null);
      setMessages([...next, { role: "assistant", content: data.reply ?? data.error ?? "Sorry, something went wrong." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn't reach the engine. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">FinPilot Co-pilot</div>
          <div className="text-[11px] text-[var(--muted)]">Grounded in your live financial data</div>
        </div>
        {source && <Badge variant="primary" className="ml-auto">{source}</Badge>}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Your Personal CFO</h3>
            <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">Ask anything about your portfolio, spending, goals or risk. I answer using your actual numbers.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface-2)]">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--primary)] px-4 py-2.5 text-sm text-white"
                  : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-[var(--surface-2)] px-4 py-2.5 text-sm leading-relaxed"
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your finances…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-[var(--border)] p-3"
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your money…" disabled={loading} />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
