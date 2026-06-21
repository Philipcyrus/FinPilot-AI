import { getDashboard } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, MetricCard } from "@/components/common";
import { InsightCard } from "@/components/InsightCard";
import { TrendArea, CategoryBars, AllocationDonut } from "@/components/charts";
import { AllocationLegend } from "@/components/ScoreBreakdown";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatPercent, formatDate } from "@/lib/utils";
import { Wallet, TrendingUp, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SpendingPage() {
  const d = await getDashboard();
  const s = d.spending;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Spending Intelligence" subtitle="Where your money goes — classified, trended and forecast." icon={<Wallet className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Latest Month" value={formatINR(s.monthlySpend, { compact: true })} sub="total spend" />
        <MetricCard label="Avg Monthly" value={formatINR(s.avgMonthlySpend, { compact: true })} sub="trailing average" />
        <MetricCard label="Spend Growth" value={formatPercent(s.lifestyleInflation)} sub="recent vs earlier" delta={s.lifestyleInflation} deltaLabel="lifestyle drift" />
        <MetricCard label="Next Month" value={formatINR(s.forecastNextMonth, { compact: true })} sub="forecast" icon={<TrendingUp className="h-4 w-4" />} accent="#0ea5e9" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendArea data={s.monthlyTrend} color="#f59e0b" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category Mix</CardTitle>
            <p className="text-xs text-[var(--muted)]">Last 3 months</p>
          </CardHeader>
          <CardContent>
            <AllocationDonut data={s.byCategory} height={150} />
            <div className="mt-4">
              <AllocationLegend data={s.byCategory.slice(0, 6)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBars data={s.byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Merchants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {s.topMerchants.map((m) => (
              <div key={m.merchant} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-2)] text-xs font-bold">
                    {m.merchant.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-tight">{m.merchant}</div>
                    <div className="text-xs text-[var(--muted)]">{m.category}</div>
                  </div>
                </div>
                <span className="num text-sm font-semibold">{formatINR(m.amount, { compact: true })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {s.anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Unusual Spending Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {s.anomalies.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{a.merchant}</div>
                  <div className="text-xs text-[var(--muted)]">{formatDate(a.date)} · {a.reason}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{a.category}</Badge>
                  <span className="num text-sm font-semibold">{formatINR(a.amount, { compact: true })}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Spending Insights</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[...s.insights, ...d.behavioral.insights.filter((i) => i.route === "/spending")].slice(0, 4).map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
