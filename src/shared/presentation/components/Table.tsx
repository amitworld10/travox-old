import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800", className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn("bg-gray-50 dark:bg-gray-950", className)}>{children}</thead>;
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={cn("divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900", className)}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      className={cn("transition-colors even:bg-gray-50/50 hover:bg-[var(--color-primary-soft)] dark:even:bg-gray-950/50 dark:hover:bg-gray-800", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  header = false,
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  header?: boolean;
  colSpan?: number;
}) {
  const Component = header ? "th" : "td";

  return (
    <Component
      className={cn(
        "px-4 py-3 align-middle",
        header
          ? "text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
          : "text-gray-900 dark:text-gray-100",
        className,
      )}
      colSpan={colSpan}
    >
      {children}
    </Component>
  );
}
