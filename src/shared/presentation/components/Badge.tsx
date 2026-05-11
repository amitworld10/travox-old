import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
};

const variantClasses = {
  default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full font-semibold", variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
}
