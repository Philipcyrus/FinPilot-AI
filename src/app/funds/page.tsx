import Link from "next/link";
import { getDashboard } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatPercent } from "@/lib/utils";
import { Layers, GitCompareArrows, ArrowRight, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FundsPage() {
  const d = await getDashboard();
  const funds = d.picture.holdings.filter((h) => h.assetClass === "mutual_fund");

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Mutual Fund Intelligence"
        subtitle="Analyze, compare and de-duplicate your funds — with live NAV-backed research."
        icon={<Layers className="h-5 w-5" />}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/research?q=Parag%20Parikh%20Flexi%20Cap%20vs%20UTI%20Nifty%2050">
              <GitCompareArrows className="h-4 w-4" /> Compare funds
            </Link>
          </Button>
        }
      />

      {/* Held funds */}
      <div className="grid gap-4 md:grid-cols-2">
        {funds.map((f) => (
          <Card key={f.id}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold leading-snug">{f.name.split(" - ")[0]}</h3>
                  <Badge variant="outline" className="mt-1">{f.sector}</Badge>
                </div>
                <div className="text-right">
                  <div className="num text-lg font-bold">{formatINR(f.value, { compact: true })}</div>
                  <div className={`num text-xs font-semibold ${f.pnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{formatPercent(f.pnlPct)}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-center text-xs">
                <div><div className="text-[var(--muted)]">Units</div><div className="num font-semibold">{f.quantity.toLocaleString("en-IN")}</div></div>
                <div><div className="text-[var(--muted)]">Avg NAV</div><div className="num font-semibold">₹{f.avgCost.toFixed(1)}</div></div>
                <div><div className="text-[var(--muted)]">Cur NAV</div><div className="num font-semibold">₹{f.currentPrice.toFixed(1)}</div></div>
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
                <Link href={`/research?q=${encodeURIComponent(f.symbol)}`}>
                  Deep research <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overlap detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Overlap Detection
          </CardTitle>
          <p className="text-xs text-[var(--muted)]">{d.overlap.summary}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Fund pairs</h4>
            <div className="space-y-2">
              {d.overlap.pairs.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)]/40 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{p.fundA.split(" - ")[0]} ↔ {p.fundB.split(" - ")[0]}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden text-xs text-[var(--muted)] sm:inline">{p.shared.slice(0, 3).join(", ")}</span>
                    <Badge variant={p.overlapPct > 40 ? "warning" : "info"}>{p.overlapPct.toFixed(0)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {d.overlap.hiddenConcentration.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Hidden concentration</h4>
              <div className="flex flex-wrap gap-2">
                {d.overlap.hiddenConcentration.map((h) => (
                  <div key={h.stock} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs">
                    <span className="font-semibold">{h.stock}</span>
                    <span className="text-[var(--muted)]"> · {h.funds.length} funds{h.alsoDirect ? " + direct" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
