"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { InsightItem } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfidenceBadge, SeverityDot } from "@/components/common";
import { cn } from "@/lib/utils";

const borderBySeverity: Record<string, string> = {
  critical: "border-l-rose-500",
  warning: "border-l-amber-500",
  positive: "border-l-emerald-500",
  info: "border-l-sky-500",
};

export function InsightCard({ insight }: { insight: InsightItem }) {
  return (
    <Dialog>
      <div
        className={cn(
          "group rounded-xl border border-l-4 border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] transition-shadow hover:shadow-md",
          borderBySeverity[insight.severity] ?? "border-l-sky-500",
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-1.5">
            <SeverityDot severity={insight.severity} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-snug">{insight.title}</h3>
              <ConfidenceBadge value={insight.confidence} className="shrink-0" />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{insight.body}</p>
            {insight.action && (
              <p className="mt-2 text-xs font-medium text-[var(--primary)]">→ {insight.action}</p>
            )}
            <div className="mt-3 flex items-center gap-3">
              {insight.evidence.length > 0 && (
                <DialogTrigger className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer">
                  View evidence <ChevronRight className="h-3 w-3" />
                </DialogTrigger>
              )}
              {insight.route && (
                <Link href={insight.route} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]">
                  Explore <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <DialogContent>
        <DialogTitle className="pr-8">{insight.title}</DialogTitle>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{insight.body}</p>
        <div className="mt-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Supporting evidence</h4>
          <div className="space-y-2">
            {insight.evidence.map((e, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{e.label}</div>
                  {e.detail && <div className="text-xs text-[var(--muted)]">{e.detail}</div>}
                </div>
                <div className="num text-sm font-semibold">{e.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2">
          <span className="text-xs text-[var(--muted)]">Confidence</span>
          <ConfidenceBadge value={insight.confidence} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
