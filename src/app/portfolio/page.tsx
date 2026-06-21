import { getDashboard } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, MetricCard, DataSourceBadge } from "@/components/common";
import { ScoreGauge, MiniGauge } from "@/components/ScoreGauge";
import { ScoreBreakdown, AllocationLegend } from "@/components/ScoreBreakdown";
import { AllocationDonut, MultiLine } from "@/components/charts";
import { HoldingsTable } from "@/components/HoldingsTable";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatPercent } from "@/lib/utils";
import { PieChart, ShieldAlert, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const d = await getDashboard();
  const { portfolio: pf, portfolioHealth: ph, risk, benchmark } = d;
  const niftyAlpha = benchmark.benchmarks.find((b) => b.symbol === "^NSEI");

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Portfolio Intelligence"
        subtitle="Your investments — analyzed, scored and explained."
        icon={<PieChart className="h-5 w-5" />}
        actions={<DataSourceBadge source="demo" />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Current Value" value={formatINR(pf.totalValue, { compact: true })} delta={pf.pnlPct} deltaLabel="unrealized" />
        <MetricCard label="Invested" value={formatINR(pf.totalInvested, { compact: true })} sub={`P/L ${formatINR(pf.pnl, { compact: true })}`} />
        <MetricCard label="XIRR" value={formatPercent(pf.xirr)} sub="money-weighted" icon={<TrendingUp className="h-4 w-4" />} accent="#10b981" />
        <MetricCard label="CAGR" value={formatPercent(pf.cagr)} sub="annualized" />
      </div>

      {/* Health + Risk */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge score={ph.score} />
            <p className="mt-3 text-center text-xs leading-relaxed text-[var(--muted)]">{ph.summary}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Health breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown subScores={ph.subScores} />
          </CardContent>
        </Card>
      </div>

      {/* Risk metrics */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" /> Risk Intelligence
          </CardTitle>
          <Badge variant={risk.riskLevel === "Low" ? "positive" : risk.riskLevel === "Moderate" ? "info" : "warning"}>
            {risk.riskLevel} risk
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <RiskStat label="Volatility" value={`${risk.volatility.toFixed(1)}%`} hint="annualized" />
            <RiskStat label="Max Drawdown" value={`${risk.maxDrawdown.toFixed(1)}%`} hint="peak-to-trough" />
            <RiskStat label="Beta vs Nifty" value={risk.beta.toFixed(2)} hint={risk.beta > 1 ? "amplifies market" : "calmer than market"} />
            <div className="flex items-center gap-3">
              <MiniGauge score={risk.stabilityScore} />
              <div>
                <div className="text-xs text-[var(--muted)]">Stability</div>
                <div className="text-sm font-semibold">{risk.stabilityScore}/100</div>
              </div>
            </div>
          </div>
          {risk.vulnerabilities.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
              {risk.vulnerabilities.map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span><span className="font-medium">{v.title}:</span> <span className="text-[var(--muted)]">{v.detail}</span></span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocation tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Diversification Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="asset">
            <TabsList>
              <TabsTrigger value="asset">Asset Class</TabsTrigger>
              <TabsTrigger value="sector">Sector</TabsTrigger>
              <TabsTrigger value="cap">Market Cap</TabsTrigger>
            </TabsList>
            {([
              ["asset", pf.byAssetClass],
              ["sector", pf.bySector],
              ["cap", pf.byMarketCap],
            ] as const).map(([key, data]) => (
              <TabsContent key={key} value={key}>
                <div className="grid items-center gap-6 sm:grid-cols-2">
                  <AllocationDonut data={data} />
                  <AllocationLegend data={data} total={pf.totalValue} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Benchmark */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Benchmark Comparison</CardTitle>
            <p className="text-xs text-[var(--muted)]">{benchmark.relativeRiskNote}</p>
          </div>
          {niftyAlpha && (
            <Badge variant={niftyAlpha.alpha >= 0 ? "positive" : "negative"}>
              {formatPercent(niftyAlpha.alpha)} alpha vs Nifty
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <MultiLine
            data={benchmark.comparison}
            series={[
              { key: "Portfolio", name: "Your Portfolio", color: "#6366f1" },
              { key: "Nifty50", name: "Nifty 50", color: "#94a3b8" },
            ]}
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {benchmark.benchmarks.map((b) => (
              <div key={b.symbol} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
                <span className="text-[var(--muted)]">{b.name}</span>
                <span className={b.alpha >= 0 ? "text-[var(--positive)] num font-semibold" : "text-[var(--negative)] num font-semibold"}>
                  {formatPercent(b.alpha)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings ({d.picture.holdings.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <HoldingsTable holdings={d.picture.holdings} />
        </CardContent>
      </Card>
    </div>
  );
}

function RiskStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="num text-xl font-bold">{value}</div>
      <div className="text-[11px] text-[var(--muted-2)]">{hint}</div>
    </div>
  );
}
