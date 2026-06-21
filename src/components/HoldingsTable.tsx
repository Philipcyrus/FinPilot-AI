import type { HoldingView } from "@/lib/types";
import { ASSET_CLASS_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn, formatINR, formatPercent } from "@/lib/utils";
import Link from "next/link";

export function HoldingsTable({ holdings }: { holdings: HoldingView[] }) {
  const sorted = [...holdings].sort((a, b) => b.value - a.value);
  const total = holdings.reduce((s, h) => s + h.value, 0) || 1;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <th className="px-3 py-2.5 font-medium">Holding</th>
            <th className="px-3 py-2.5 text-right font-medium">Qty</th>
            <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Avg / LTP</th>
            <th className="px-3 py-2.5 text-right font-medium">Value</th>
            <th className="px-3 py-2.5 text-right font-medium">P/L</th>
            <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Weight</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => {
            const isMf = h.assetClass === "mutual_fund";
            return (
              <tr key={h.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/60">
                <td className="px-3 py-3">
                  <Link href={`/research?q=${encodeURIComponent(h.symbol)}`} className="block">
                    <div className="font-medium leading-tight hover:text-[var(--primary)]">{h.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {ASSET_CLASS_LABEL[h.assetClass] ?? h.assetClass}
                      </Badge>
                      <span className="text-xs text-[var(--muted)]">{h.sector}</span>
                    </div>
                  </Link>
                </td>
                <td className="num px-3 py-3 text-right text-[var(--muted)]">{h.quantity.toLocaleString("en-IN")}</td>
                <td className="num hidden px-3 py-3 text-right text-[var(--muted)] sm:table-cell">
                  {isMf ? h.avgCost.toFixed(1) : formatINR(h.avgCost)} / {isMf ? h.currentPrice.toFixed(1) : formatINR(h.currentPrice)}
                </td>
                <td className="num px-3 py-3 text-right font-semibold">{formatINR(h.value, { compact: true })}</td>
                <td className="px-3 py-3 text-right">
                  <div className={cn("num font-semibold", h.pnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]")}>
                    {formatPercent(h.pnlPct)}
                  </div>
                  <div className={cn("num text-xs", h.pnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]")}>
                    {h.pnl >= 0 ? "+" : ""}
                    {formatINR(h.pnl, { compact: true })}
                  </div>
                </td>
                <td className="num hidden px-3 py-3 text-right text-[var(--muted)] md:table-cell">
                  {((h.value / total) * 100).toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
