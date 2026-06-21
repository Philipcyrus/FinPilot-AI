"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SCENARIO_PRESETS, type ScenarioId, type ScenarioResult } from "@/lib/engines/scenario";
import { Progress } from "@/components/ui/progress";
import { formatINR, formatPercent, cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

export function ScenarioClient() {
  const [active, setActive] = useState<ScenarioId>("market_crash");
  const [mag, setMag] = useState(30);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  const preset = SCENARIO_PRESETS.find((p) => p.id === active)!;

  const run = useCallback(async (id: ScenarioId, magnitude: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, magnitude }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced run on change
  useEffect(() => {
    const t = setTimeout(() => run(active, mag), 250);
    return () => clearTimeout(t);
  }, [active, mag, run]);

  const resilienceVariant = result?.resilience === "strong" ? "positive" : result?.resilience === "moderate" ? "warning" : "negative";

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Choose a shock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {SCENARIO_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActive(p.id);
                  setMag(p.defaultMag);
                }}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active === p.id ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]" : "border-[var(--border)] hover:bg-[var(--surface-2)]",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{preset.label} intensity</span>
              <span className="num font-bold text-[var(--primary)]">{mag}</span>
            </div>
            <Slider value={[mag]} onValueChange={(v) => setMag(v[0])} min={5} max={100} step={5} />
            <p className="mt-2 text-xs text-[var(--muted)]">Drag to adjust the severity of the {preset.label.toLowerCase()} scenario.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{result?.title ?? "Simulating…"}</CardTitle>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" /> : result && <Badge variant={resilienceVariant}>{result.resilience} resilience</Badge>}
        </CardHeader>
        <CardContent>
          {result && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)]">{result.assumption}</p>

              <div className="grid grid-cols-3 gap-3">
                <Stat label="Before" value={formatINR(result.portfolioBefore, { compact: true })} />
                <Stat label="After" value={formatINR(result.portfolioAfter, { compact: true })} accent={result.portfolioImpactPct < 0 ? "var(--negative)" : "var(--positive)"} />
                <Stat label="Impact" value={formatPercent(result.portfolioImpactPct)} accent={result.portfolioImpactPct < 0 ? "var(--negative)" : "var(--positive)"} />
              </div>

              <div>
                <div className="mb-1 text-xs text-[var(--muted)]">Cashflow impact</div>
                <p className="text-sm">{result.cashflowImpact}</p>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Goal impact</div>
                <div className="space-y-2.5">
                  {result.goalImpact.map((g) => (
                    <div key={g.goal}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{g.goal}</span>
                        <span className="num text-[var(--muted)]">
                          {g.before}% → <span className={g.after < g.before ? "text-[var(--negative)]" : "text-[var(--positive)]"}>{g.after}%</span>
                        </span>
                      </div>
                      <Progress value={g.after} color={g.after >= 70 ? "#10b981" : g.after >= 45 ? "#f59e0b" : "#ef4444"} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-[var(--surface-2)]/50 p-3 text-sm leading-relaxed">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                {result.narrative}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3 text-center">
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className="num text-lg font-bold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
