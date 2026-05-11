import { Loader } from "lucide-react";
import { cn } from "../lib/cn";

type SpinnerProps = {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "gray";
  className?: string;
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const colorClasses = {
  primary: "text-[var(--color-primary)] dark:text-[var(--color-primary-300)]",
  white: "text-white",
  gray: "text-gray-600 dark:text-gray-400",
};

export function Spinner({ size = "md", color = "primary", className }: SpinnerProps) {
  return (
    <Loader
      aria-hidden="true"
      className={cn(sizeClasses[size], colorClasses[color], "animate-spin", className)}
    />
  );
}
