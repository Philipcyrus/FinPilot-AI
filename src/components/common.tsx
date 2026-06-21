import { cn, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, ShieldCheck, Sparkles, Wifi, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
        {icon && <span className="text-[var(--muted-2)]" style={accent ? { color: accent } : undefined}>{icon}</span>}
      </div>
      <div className="num mt-2 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", positive ? "text-[var(--positive)]" : "text-[var(--negative)]")}>
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {formatPercent(Math.abs(delta))}
          </span>
        )}
        {(deltaLabel || sub) && <span className="text-xs text-[var(--muted)]">{deltaLabel ?? sub}</span>}
      </div>
    </div>
  );
}

export function ConfidenceBadge({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const variant = pct >= 80 ? "positive" : pct >= 60 ? "info" : "warning";
  return (
    <Badge variant={variant} className={className} title="Confidence reflects data completeness, quality and assumption certainty.">
      <ShieldCheck className="h-3 w-3" />
      {pct}% confidence
    </Badge>
  );
}

export function DataSourceBadge({ source }: { source: "live" | "cached" | "demo" }) {
  const map = {
    live: { variant: "positive" as const, icon: <Wifi className="h-3 w-3" />, label: "Live data" },
    cached: { variant: "info" as const, icon: <Wifi className="h-3 w-3" />, label: "Cached" },
    demo: { variant: "outline" as const, icon: <WifiOff className="h-3 w-3" />, label: "Demo data" },
  };
  const m = map[source];
  return (
    <Badge variant={m.variant}>
      {m.icon}
      {m.label}
    </Badge>
  );
}

export function AiBadge({ label = "AI" }: { label?: string }) {
  return (
    <Badge variant="primary">
      <Sparkles className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body?: string; icon?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
      {icon && <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--muted)]">{icon}</div>}
      <h3 className="font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">{body}</p>}
    </div>
  );
}

export function SeverityDot({ severity }: { severity: string }) {
  const color =
    severity === "critical" ? "bg-rose-500" : severity === "warning" ? "bg-amber-500" : severity === "positive" ? "bg-emerald-500" : "bg-sky-500";
  return <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", color)} />;
}
