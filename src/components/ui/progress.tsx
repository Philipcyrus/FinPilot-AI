import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  color,
  trackClassName,
}: {
  value: number;
  className?: string;
  color?: string;
  trackClassName?: string;
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]", trackClassName, className)}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color ?? "var(--primary)" }}
      />
    </div>
  );
}
