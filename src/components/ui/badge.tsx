import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--surface-2)] text-[var(--foreground)]",
        outline: "border-[var(--border)] text-[var(--muted)]",
        positive: "border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        negative: "border-transparent bg-rose-500/12 text-rose-600 dark:text-rose-400",
        warning: "border-transparent bg-amber-500/12 text-amber-600 dark:text-amber-400",
        info: "border-transparent bg-sky-500/12 text-sky-600 dark:text-sky-400",
        primary: "border-transparent bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
