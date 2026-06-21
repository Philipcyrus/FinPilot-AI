import { getDashboard } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MiniGauge } from "@/components/ScoreGauge";
import { formatINR } from "@/lib/utils";
import { Target, Home, GraduationCap, Umbrella, TrendingUp, Sparkles } from "lucide-react";
import type { GoalAnalysis } from "@/lib/engines";

export const dynamic = "force-dynamic";

const goalIcon: Record<string, typeof Target> = {
  retirement: Umbrella,
  house: Home,
  education: GraduationCap,
  emergency: Umbrella,
  wealth: TrendingUp,
  custom: Target,
};

const statusVariant = { "on-track": "positive", "at-risk": "warning", "off-track": "negative" } as const;

export default async function GoalsPage() {
  const d = await getDashboard();
  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Goal Intelligence" subtitle="Track progress, projections and success probability for every goal." icon={<Target className="h-5 w-5" />} />
      <div className="grid gap-5 lg:grid-cols-2">
        {d.goals.map((g) => (
          <GoalCard key={g.goal.id} g={g} />
        ))}
      </div>
    </div>
  );
}

function GoalCard({ g }: { g: GoalAnalysis }) {
  const Icon = goalIcon[g.goal.type] ?? Target;
  const shortfall = g.projectedValue - g.goal.targetAmount;
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{g.goal.name}</CardTitle>
            <p className="text-xs text-[var(--muted)]">
              {formatINR(g.goal.targetAmount, { compact: true })} by {new Date(g.goal.targetDate).getFullYear()} · {g.yearsLeft.toFixed(1)} yrs left
            </p>
          </div>
        </div>
        <Badge variant={statusVariant[g.status]}>{g.status.replace("-", " ")}</Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="num font-semibold">{formatINR(g.goal.currentAmount, { compact: true })}</span>
          <span className="text-[var(--muted)]">{g.progressPct.toFixed(0)}%</span>
        </div>
        <Progress value={g.progressPct} color={g.status === "on-track" ? "#10b981" : g.status === "at-risk" ? "#f59e0b" : "#ef4444"} />

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <MiniGauge score={g.successProbability * 100} size={64} />
            <div>
              <div className="text-xs text-[var(--muted)]">Success probability</div>
              <div className="text-sm font-semibold">Monte Carlo · {(g.successProbability * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 text-center">
          <Stat label="Monthly now" value={formatINR(g.goal.monthlyContribution, { compact: true })} />
          <Stat label="Needed/mo" value={formatINR(g.requiredMonthly, { compact: true })} />
          <Stat label="Projected" value={formatINR(g.projectedValue, { compact: true })} />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--surface-2)]/50 p-3 text-xs leading-relaxed text-[var(--muted)]">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
          {g.contributionGap > 500
            ? `On the current plan you'd reach ${formatINR(g.projectedValue, { compact: true })} — a ${formatINR(Math.abs(shortfall), { compact: true })} ${shortfall < 0 ? "shortfall" : "surplus"}. Adding ${formatINR(g.contributionGap, { compact: true })}/month closes the gap.`
            : `You're on pace to reach this goal. Projected ${formatINR(g.projectedValue, { compact: true })} vs target ${formatINR(g.goal.targetAmount, { compact: true })}.`}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className="num text-sm font-bold">{value}</div>
    </div>
  );
}
