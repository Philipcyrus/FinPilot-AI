"use client";

import type { RecommendationItem } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/common";
import { Lightbulb, ChevronRight } from "lucide-react";

const riskVariant = { low: "positive", medium: "warning", high: "negative" } as const;
const impactVariant = { low: "outline", medium: "info", high: "primary" } as const;

export function RecommendationPreview({ rec }: { rec: RecommendationItem }) {
  return (
    <Dialog>
      <DialogTrigger className="flex w-full items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3 text-left transition-colors hover:bg-[var(--surface-2)] cursor-pointer">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--primary)]/12 text-[var(--primary)]">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{rec.title}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted)]">{rec.explanation}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant={impactVariant[rec.impact]}>{rec.impact} impact</Badge>
            <Badge variant={riskVariant[rec.riskLevel]}>{rec.riskLevel} risk</Badge>
          </div>
        </div>
      </DialogTrigger>
      <RecDialogContent rec={rec} />
    </Dialog>
  );
}

export function RecommendationCard({ rec }: { rec: RecommendationItem }) {
  return (
    <Dialog>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)]">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary)]/12 text-[var(--primary)]">
            <Lightbulb className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-snug">{rec.title}</h3>
              <ConfidenceBadge value={rec.confidence} className="shrink-0" />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{rec.explanation}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant={impactVariant[rec.impact]}>{rec.impact} impact</Badge>
              <Badge variant={riskVariant[rec.riskLevel]}>{rec.riskLevel} risk</Badge>
              <Badge variant="outline">{rec.category}</Badge>
              <DialogTrigger className="ml-auto text-xs font-medium text-[var(--primary)] cursor-pointer hover:underline">
                Evidence & alternatives →
              </DialogTrigger>
            </div>
          </div>
        </div>
      </div>
      <RecDialogContent rec={rec} />
    </Dialog>
  );
}

function RecDialogContent({ rec }: { rec: RecommendationItem }) {
  return (
    <DialogContent>
      <DialogTitle className="pr-8">{rec.title}</DialogTitle>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{rec.explanation}</p>

      <div className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Supporting evidence</h4>
        <div className="space-y-2">
          {rec.evidence.map((e, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
              <span className="text-sm font-medium">{e.label}</span>
              <span className="num text-sm font-semibold">{e.value}</span>
            </div>
          ))}
        </div>
      </div>

      {rec.alternatives.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Alternative options</h4>
          <ul className="space-y-1.5">
            {rec.alternatives.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-[var(--muted)]">
                <span className="text-[var(--primary)]">•</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <Badge variant={impactVariant[rec.impact]}>{rec.impact} impact</Badge>
        <Badge variant={riskVariant[rec.riskLevel]}>{rec.riskLevel} risk</Badge>
        <ConfidenceBadge value={rec.confidence} />
      </div>
    </DialogContent>
  );
}
