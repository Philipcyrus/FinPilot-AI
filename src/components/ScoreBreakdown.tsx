import type { SubScore, AllocationSlice } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { scoreColor, formatINR, formatPercent } from "@/lib/utils";

export function ScoreBreakdown({ subScores }: { subScores: SubScore[] }) {
  return (
    <div className="space-y-3.5">
      {subScores.map((s) => (
        <div key={s.key}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{s.label}</span>
            <span className="num text-sm font-semibold" style={{ color: scoreColor(s.score) }}>
              {s.score}
            </span>
          </div>
          <Progress value={s.score} color={scoreColor(s.score)} />
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{s.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function AllocationLegend({ data, total }: { data: AllocationSlice[]; total?: number }) {
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
          <span className="flex-1 truncate text-sm">{d.name}</span>
          <span className="num text-sm font-medium text-[var(--muted)]">{formatPercent(d.pct, 0).replace("+", "")}</span>
          {total !== undefined && <span className="num w-20 text-right text-sm font-semibold">{formatINR(d.value, { compact: true })}</span>}
        </div>
      ))}
    </div>
  );
}
