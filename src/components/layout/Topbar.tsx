"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Menu, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Standard next-themes hydration guard — render theme-dependent UI only after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur-md md:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 hover:bg-[var(--surface-2)] md:hidden" aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>

      <Link
        href="/research"
        className="hidden flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:border-[var(--ring)] sm:flex md:max-w-md"
      >
        <Search className="h-4 w-4" />
        Research any stock, fund, or ask a question…
        <kbd className="ml-auto rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted-2)]">⌘K</kbd>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href="/chat">Ask AI</Link>
        </Button>
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-3">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-sky-500 text-xs font-bold text-white">
            AM
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-xs font-semibold">Aarav Mehta</div>
            <div className="text-[10px] text-[var(--muted)]">Demo</div>
          </div>
        </div>
      </div>
    </header>
  );
}
