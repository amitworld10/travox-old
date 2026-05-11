import type { ComponentType } from "react";
import { cn } from "../lib/cn";

type StatCardProps = {
  label: string;
  value: string;
  tone?: "primary" | "neutral" | "success" | "warning";
  icon?: ComponentType<{ className?: string }>;
};

const toneClasses = {
  primary: "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]",
  neutral: "border-gray-200 bg-white text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
};

export function StatCard({ label, value, tone = "neutral", icon: Icon }: StatCardProps) {
  return (
    <div className={cn("rounded-md border px-4 py-3", toneClasses[tone])}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-current/70">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-current/60" /> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
