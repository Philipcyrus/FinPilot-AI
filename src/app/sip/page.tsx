import { getDashboard } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, MetricCard } from "@/components/common";
import { InsightCard } from "@/components/InsightCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { Repeat, MessageCircleQuestion } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SipPage() {
  const d = await getDashboard();
  const s = d.sip;
  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="SIP Intelligence" subtitle="Are you investing enough, in the right things, aligned to your goals?" icon={<Repeat className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Monthly SIP" value={formatINR(s.totalMonthly, { compact: true })} sub={`${s.count} active funds`} />
        <MetricCard label="% of Income" value={`${((s.totalMonthly / d.picture.user.monthlyIncome) * 100).toFixed(0)}%`} sub="benchmark 20-25%" />
        <MetricCard label="Goal Aligned" value={`${s.goalAligned.toFixed(0)}%`} sub="mapped to goals" accent="#10b981" />
        <MetricCard label="Adequacy" value={s.adequacy.investingEnough ? "On track" : "Below target"} sub={s.adequacy.gap > 0 ? `+${formatINR(s.adequacy.gap, { compact: true })} suggested` : "meeting benchmark"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SIP Allocation by Style</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {s.byStyle.map((b) => (
              <div key={b.style}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{b.style}</span>
                  <span className="num text-[var(--muted)]">{formatINR(b.amount, { compact: true })} · {b.pct.toFixed(0)}%</span>
                </div>
                <Progress value={b.pct} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleQuestion className="h-4 w-4 text-[var(--primary)]" /> Your SIP Questions, Answered
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.questions.map((qa, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
                <div className="text-sm font-semibold">{qa.q}</div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{qa.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {d.overlap.pairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overlap Check</CardTitle>
            <p className="text-xs text-[var(--muted)]">{d.overlap.summary}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.overlap.pairs.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)]/40 px-3 py-2 text-sm">
                <span>{p.fundA.split(" - ")[0]} ↔ {p.fundB.split(" - ")[0]}</span>
                <Badge variant={p.overlapPct > 40 ? "warning" : "info"}>{p.overlapPct.toFixed(0)}% overlap</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {s.insights.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">SIP Insights</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {s.insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
