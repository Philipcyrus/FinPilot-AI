import Link from "next/link";
import { getDashboard } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ScoreGauge";
import { ScoreBreakdown, AllocationLegend } from "@/components/ScoreBreakdown";
import { InsightCard } from "@/components/InsightCard";
import { MetricCard, AiBadge } from "@/components/common";
import { AllocationDonut, TrendArea } from "@/components/charts";
import { RecommendationPreview } from "@/components/RecommendationCard";
import { formatINR, formatPercent } from "@/lib/utils";
import { TrendingUp, Wallet, PiggyBank, Target, ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const d = await getDashboard();
  const { financialHealth: fh, portfolio, savings, netWorth } = d;
  const goalsOnTrack = d.goals.filter((g) => g.status === "on-track").length;

  return (
    <div className="space-y-6 animate-in">
      {/* Greeting */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Good evening, {d.picture.user.name.split(" ")[0]}</h1>
          <AiBadge label="Digital Twin active" />
        </div>
        <p className="text-sm text-[var(--muted)]">{fh.summary}</p>
      </div>

      {/* Hero: health score + key metrics */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" /> Financial Health Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge score={fh.score} sublabel={`Weakest: ${fh.evidence[2]?.value}`} />
            <Link href="/recommendations" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]">
              See how to improve <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown subScores={fh.subScores} />
          </CardContent>
        </Card>
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Net Worth" value={formatINR(netWorth, { compact: true })} sub="Investments + reserves" icon={<TrendingUp className="h-4 w-4" />} accent="#6366f1" />
        <MetricCard label="Portfolio Value" value={formatINR(portfolio.totalValue, { compact: true })} delta={portfolio.pnlPct} deltaLabel="all-time" icon={<Wallet className="h-4 w-4" />} />
        <MetricCard label="Savings Rate" value={`${savings.savingsRate.toFixed(0)}%`} sub={`${savings.emergencyMonths.toFixed(1)} mo emergency fund`} icon={<PiggyBank className="h-4 w-4" />} accent="#10b981" />
        <MetricCard label="Goals On Track" value={`${goalsOnTrack}/${d.goals.length}`} sub="success-weighted" icon={<Target className="h-4 w-4" />} accent="#0ea5e9" />
      </div>

      {/* Net worth trend + allocation */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Portfolio Trajectory</CardTitle>
              <p className="text-xs text-[var(--muted)]">Reconstructed from price history · XIRR {formatPercent(portfolio.xirr)}</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/portfolio">Details <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <TrendArea data={portfolio.history} color="#6366f1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonut data={portfolio.byAssetClass} height={170} />
            <div className="mt-4">
              <AllocationLegend data={portfolio.byAssetClass} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">What needs your attention</h2>
        <span className="text-xs text-[var(--muted)]">{d.insights.length} insights · evidence-backed</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {d.insights.slice(0, 4).map((i) => (
          <InsightCard key={i.id} insight={i} />
        ))}
      </div>

      {/* Recommendations preview */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--primary)]" /> Top recommendations
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/recommendations">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {d.recommendations.slice(0, 3).map((r) => (
            <RecommendationPreview key={r.id} rec={r} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
