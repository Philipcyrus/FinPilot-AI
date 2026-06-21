import { getDashboard } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, MetricCard } from "@/components/common";
import { GroupedBars } from "@/components/charts";
import { Progress } from "@/components/ui/progress";
import { MiniGauge } from "@/components/ScoreGauge";
import { formatINR } from "@/lib/utils";
import { PiggyBank, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const d = await getDashboard();
  const s = d.savings;
  const efTarget = 6;
  const efPct = Math.min(100, (s.emergencyMonths / efTarget) * 100);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Savings Intelligence" subtitle="How consistently you save — and how protected you are." icon={<PiggyBank className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Savings Rate" value={`${s.savingsRate.toFixed(0)}%`} sub="of income" accent="#10b981" icon={<PiggyBank className="h-4 w-4" />} />
        <MetricCard label="Monthly Surplus" value={formatINR(s.surplus, { compact: true })} sub="income − spend" />
        <MetricCard label="Avg Invested" value={formatINR(s.avgInvested, { compact: true })} sub="per month via SIP" />
        <MetricCard label="Consistency" value={`${s.consistency}/100`} sub="surplus stability" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Emergency Fund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <MiniGauge score={efPct} size={72} />
              <div>
                <div className="num text-2xl font-bold">{s.emergencyMonths.toFixed(1)} mo</div>
                <div className="text-xs text-[var(--muted)]">of {efTarget} months target</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                <span>{formatINR(s.emergencyFund, { compact: true })}</span>
                <span>{formatINR(s.avgExpense * efTarget, { compact: true })} goal</span>
              </div>
              <Progress value={efPct} color="#10b981" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
              {s.emergencyMonths >= efTarget
                ? "You're fully covered — a strong buffer that protects your investments from forced selling during income shocks."
                : `You're ${(efTarget - s.emergencyMonths).toFixed(1)} months short of a full buffer. Topping this up should come before extra equity risk.`}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income vs Spend vs Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupedBars
              data={s.trend}
              series={[
                { key: "income", name: "Income", color: "#6366f1" },
                { key: "spend", name: "Spend", color: "#f59e0b" },
                { key: "saved", name: "Saved", color: "#10b981" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sustainability Assessment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Assessment label="Consistency" verdict={s.consistency >= 70 ? "Strong" : s.consistency >= 50 ? "Fair" : "Volatile"} detail="Month-to-month surplus stability." good={s.consistency >= 70} />
          <Assessment label="Savings Rate" verdict={s.savingsRate >= 20 ? "Healthy" : "Below target"} detail="Benchmark is 20%+ of income." good={s.savingsRate >= 20} />
          <Assessment label="Emergency Cover" verdict={s.emergencyMonths >= 6 ? "Fully covered" : s.emergencyMonths >= 3 ? "Partial" : "Thin"} detail="Target 6 months of expenses." good={s.emergencyMonths >= 6} />
        </CardContent>
      </Card>
    </div>
  );
}

function Assessment({ label, verdict, detail, good }: { label: string; verdict: string; detail: string; good: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className={`mt-1 text-lg font-bold ${good ? "text-[var(--positive)]" : "text-[var(--warning)]"}`}>{verdict}</div>
      <div className="mt-1 text-xs text-[var(--muted)]">{detail}</div>
    </div>
  );
}
