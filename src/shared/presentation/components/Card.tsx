import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900",
        hover && "transition hover:border-gray-300 hover:shadow-md dark:hover:border-gray-700",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-b border-gray-200 px-5 py-4 dark:border-gray-800", className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
