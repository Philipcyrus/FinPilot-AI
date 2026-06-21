"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { NAV, NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight">{APP_NAME}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Wealth OS</div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group} className="flex flex-col gap-1">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              {group}
            </div>
            {NAV.filter((n) => n.group === group).map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--primary)]" />}
                  <Icon className={cn("h-[18px] w-[18px]", active && "text-[var(--primary)]")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[11px] leading-relaxed text-[var(--muted)]">
        Educational intelligence only — not investment advice.
      </div>
    </div>
  );
}
