"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Info, X, XCircle } from "lucide-react";

type ToastDetail = {
  message: string;
  kind?: "success" | "error" | "info";
};

type ToastItem = ToastDetail & {
  id: string;
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

export function notify(detail: ToastDetail) {
  window.dispatchEvent(new CustomEvent<ToastDetail>("travox:toast", { detail }));
}

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      const item = { id: crypto.randomUUID(), kind: "info" as const, ...detail };
      setItems((current) => [...current, item].slice(-4));
      window.setTimeout(() => {
        setItems((current) => current.filter((toast) => toast.id !== item.id));
      }, 4200);
    }

    window.addEventListener("travox:toast", handleToast);
    return () => window.removeEventListener("travox:toast", handleToast);
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
      {items.map((item) => {
        const Icon = icons[item.kind ?? "info"];
        return (
          <div
            className="rounded-md border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-900"
            key={item.id}
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
              <p className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{item.message}</p>
              <button
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
