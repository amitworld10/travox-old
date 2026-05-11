"use client";

import type { ButtonHTMLAttributes, ComponentType } from "react";
import { cn } from "../lib/cn";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ComponentType<{ className?: string }>;
  iconPosition?: "left" | "right";
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-strong)]",
  secondary: "border border-gray-600 bg-gray-700 text-white shadow-sm hover:bg-gray-800",
  danger: "border border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700",
  outline:
    "border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
  ghost:
    "border border-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const iconOnly = Boolean(Icon && !children);

  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)] disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        sizeClasses[iconOnly ? "icon" : size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" color={variant === "primary" || variant === "danger" ? "white" : "gray"} /> : null}
      {!loading && Icon && iconPosition === "left" ? <Icon className={cn("h-4 w-4", Boolean(children) && "mr-2")} /> : null}
      {children}
      {!loading && Icon && iconPosition === "right" ? <Icon className="ml-2 h-4 w-4" /> : null}
    </button>
  );
}
