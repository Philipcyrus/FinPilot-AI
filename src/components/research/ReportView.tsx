"use client";

import type { ResearchReport } from "@/lib/ai/research";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfidenceBadge } from "@/components/common";
import { AgentTrace } from "./AgentTrace";
import { scoreColor } from "@/lib/utils";
import { FileText, Newspaper, TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react";

const stanceStyle: Record<string, { variant: "positive" | "negative" | "warning" | "info"; icon: typeof TrendingUp }> = {
  Bullish: { variant: "positive", icon: TrendingUp },
  Bearish: { variant: "negative", icon: TrendingDown },
  Mixed: { variant: "warning", icon: Minus },
  Neutral: { variant: "info", icon: Minus },
};

export function ReportView({ report }: { report: ResearchReport }) {
  const stance = stanceStyle[report.verdict.stance] ?? stanceStyle.Neutral;
  const StanceIcon = stance.icon;
  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{report.entityName}</h2>
                <Badge variant="outline">{report.entityRef}</Badge>
                <Badge variant="primary">{report.mode}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {report.evidence.source} · {report.source} · {report.sections.length} sections
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant={stance.variant} className="text-sm">
                <StanceIcon className="h-3.5 w-3.5" /> {report.verdict.stance}
              </Badge>
              <ConfidenceBadge value={report.confidence} />
            </div>
          </div>

          {/* Executive summary */}
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" /> Executive Summary
            </div>
            <p className="text-sm leading-relaxed">{report.thesis}</p>
            <p className="mt-2 text-xs italic text-[var(--muted)]">{report.verdict.line}</p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics + confidence */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Key Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {report.evidence.metrics.map((m, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
                  <div className="text-[11px] text-[var(--muted)]">{m.label}</div>
                  <div className="num text-base font-bold">{m.value}</div>
                  {m.detail && <div className="text-[10px] text-[var(--muted-2)]">{m.detail}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Confidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.confidenceFactors.map((f, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{f.label}</span>
                  <span className="num" style={{ color: scoreColor(f.score) }}>{f.score}</span>
                </div>
                <Progress value={f.score} color={scoreColor(f.score)} />
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">{f.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Agent trace */}
      <AgentTrace trace={report.agentTrace} />

      {/* Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {report.sections.map((s) => (
          <Card key={s.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-[var(--primary)]" /> {s.title}
                <span className="ml-auto text-[10px] font-normal text-[var(--muted-2)]">{s.agent}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm leading-relaxed text-[var(--foreground)]/90 whitespace-pre-wrap">{s.body}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* News */}
      {report.evidence.news.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" /> News & Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.evidence.news.slice(0, 6).map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-[var(--surface-2)]">
                <Badge variant={n.impact === "positive" ? "positive" : n.impact === "negative" ? "negative" : "outline"} className="mt-0.5 shrink-0">
                  {n.impact}
                </Badge>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-[var(--muted)]">{n.source}</div>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
