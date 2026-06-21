"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataSourceBadge } from "@/components/common";
import type { NewsItem } from "@/lib/providers/types";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "positive", "neutral", "negative"] as const;
const PRESETS = ["Indian stock market", "Nifty 50", "TCS", "Reliance", "HDFC Bank", "Mutual funds India"];

export function NewsClient({ initialQuery = "Indian stock market" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [input, setInput] = useState(initialQuery);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(query);
  }, [query, load]);

  const filtered = filter === "all" ? items : items.filter((i) => i.impact === filter);
  const counts = {
    positive: items.filter((i) => i.impact === "positive").length,
    negative: items.filter((i) => i.impact === "negative").length,
    neutral: items.filter((i) => i.impact === "neutral").length,
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search news by stock, sector or theme" className="pl-9" />
          </div>
          <Button type="submit">Search</Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => { setInput(p); setQuery(p); }} className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              {p}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              {f} {f !== "all" && `(${counts[f]})`}
            </button>
          ))}
        </div>
        <DataSourceBadge source={items[0]?.link === "#" ? "demo" : "live"} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
          <Loader2 className="h-5 w-5 animate-spin" /> Fetching latest news…
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] transition-shadow hover:shadow-md">
              <Badge variant={n.impact === "positive" ? "positive" : n.impact === "negative" ? "negative" : "outline"} className="mt-0.5 shrink-0 capitalize">
                {n.impact}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-snug group-hover:text-[var(--primary)]">{n.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{n.source}</span>
                  <span>·</span>
                  <span>{timeAgo(n.publishedAt)}</span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-[var(--muted-2)] opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
          {filtered.length === 0 && <p className="py-12 text-center text-sm text-[var(--muted)]">No {filter} news found.</p>}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600e3);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
