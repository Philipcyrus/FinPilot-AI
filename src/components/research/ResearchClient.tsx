"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RESEARCH_MODES, type ResearchMode } from "@/lib/constants";
import type { ResearchReport } from "@/lib/ai/research";
import { ReportView } from "./ReportView";
import { RunningTrace } from "./AgentTrace";
import { Search, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLES = ["Analyze TCS", "TCS vs Infosys", "Reliance", "Parag Parikh Flexi Cap", "Analyze HDFC Bank", "ICICI Bank"];

const RUNNING_AGENTS = [
  "Router — classifying query",
  "Evidence Gatherer — pulling prices & news",
  "Business Analyst",
  "Financial Analyst",
  "Valuation Analyst",
  "Risk Analyst",
  "Bull & Bear desk",
  "Lead Analyst — synthesizing",
];

export function ResearchClient() {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ResearchMode>("standard");
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (q: string, m: ResearchMode) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode: m }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Research failed");
      setReport(data as ResearchReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-run from ?q=
  useEffect(() => {
    const q = params.get("q");
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(q);
      run(q, "standard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Universal Research Engine</h1>
            <p className="text-xs text-[var(--muted)]">Ask about any stock, fund, sector or comparison. A team of AI analysts builds an evidence-based report.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(query, mode);
          }}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Analyze TCS, or TCS vs Infosys" className="pl-9" />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="sm:w-auto">
            {loading ? "Researching…" : "Run Research"}
          </Button>
        </form>

        {/* Mode selector */}
        <div className="mt-3 flex flex-wrap gap-2">
          {RESEARCH_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              type="button"
              title={m.desc}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                mode === m.id ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]",
              )}
            >
              {m.label} · {m.agents} agents
            </button>
          ))}
        </div>

        {/* Examples */}
        {!report && !loading && (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  run(ex, mode);
                }}
                className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </Card>

      {error && (
        <Card className="flex items-center gap-2 border-rose-500/30 p-4 text-sm text-rose-500">
          <AlertCircle className="h-4 w-4" /> {error}
        </Card>
      )}

      {loading && <RunningTrace agents={RUNNING_AGENTS.slice(0, RESEARCH_MODES.find((m) => m.id === mode)!.agents)} />}

      {report && <ReportView report={report} />}
    </div>
  );
}
