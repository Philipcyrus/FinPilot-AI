"use client";

import type { AgentTraceItem } from "@/lib/ai/research";
import { Check, Cpu, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentTrace({ trace, running }: { trace: AgentTraceItem[]; running?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        <Cpu className="h-3.5 w-3.5" /> Analyst team {running ? "working…" : "trace"}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {trace.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                t.status === "done" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500",
              )}
            >
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </span>
            <span className="font-medium">{t.agent}</span>
            <span className="truncate text-xs text-[var(--muted)]">· {t.role}</span>
            <span className="ml-auto shrink-0 text-[10px] text-[var(--muted-2)]">{t.model}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RunningTrace({ agents }: { agents: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Assembling analyst team…
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {agents.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ animationDelay: `${i * 120}ms` }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--primary)]" />
            <span className="text-[var(--muted)]">{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
