"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Clock,
  Command,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  Moon,
  Receipt,
  RefreshCw,
  Shield,
  Sun,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ActorContext } from "@/shared/application/actor-context";
import { Button, ToastViewport, notify } from "../components/client";
import { cn } from "../lib/cn";
import type { ShellNavGroup } from "./navigation";
import { quickActionsByRoute, routeLabels } from "./navigation";

type ProtectedShellProps = {
  actor: ActorContext;
  navGroups: ShellNavGroup[];
  maintenance: {
    enabled: boolean;
    message?: string;
    details?: string;
  };
  logoutAction: () => Promise<void>;
  children: ReactNode;
};

const iconMap = {
  Building2,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Receipt,
  RefreshCw,
  Shield,
  Users,
};

export function ProtectedShell({ actor, navGroups, maintenance, logoutAction, children }: ProtectedShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const themeHydrated = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!themeHydrated.current) {
      return;
    }

    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("travox-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (window.localStorage.getItem("travox-theme") === "dark") {
      document.documentElement.classList.add("dark");
    }

    const frameId = window.requestAnimationFrame(() => {
      themeHydrated.current = true;
      setDarkMode(window.localStorage.getItem("travox-theme") === "dark");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const quickActions = quickActionsByRoute[pathname] ?? [];
  const commands = useMemo(() => navGroups.flatMap((group) => group.items), [navGroups]);
  const pageTitle = pageTitleFromPath(pathname);
  const displayName = actor.email ?? actor.userId;
  const initials = displayName.slice(0, 2).toUpperCase();

  async function logout() {
    notify({ kind: "success", message: "Logged out successfully" });
    await logoutAction();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 dark:bg-gray-950 dark:text-gray-100">
      {sidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5 dark:border-gray-800">
          <Link className="flex items-center gap-3" href="/customers" onClick={() => setSidebarOpen(false)}>
            <Image alt="Travox" height={34} priority src="/brand/travox-logo-light.svg" width={122} />
          </Link>
          <div className="flex items-center gap-1">
            <Button aria-label="Open command palette" icon={Command} onClick={() => setCommandOpen(true)} size="icon" variant="ghost" />
            <Button
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              icon={darkMode ? Sun : Moon}
              onClick={() => setDarkMode((current) => !current)}
              size="icon"
              variant="ghost"
            />
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div className="mb-5" key={group.title}>
              <p className="px-3 pb-2 text-xs font-semibold uppercase text-gray-400">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? FileText;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      className={cn(
                        "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-[var(--color-primary)] text-white"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
                      )}
                      href={item.href}
                      key={item.id}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className={cn("mr-3 h-4 w-4", active ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{actor.roles.join(", ") || "User"}</p>
            </div>
            <Button aria-label="Logout" icon={LogOut} onClick={logout} size="icon" variant="ghost" />
          </div>
        </div>
      </aside>

      <Button
        aria-label="Toggle navigation"
        className="fixed right-4 top-4 z-50 lg:hidden"
        icon={sidebarOpen ? X : Menu}
        onClick={() => setSidebarOpen((current) => !current)}
        size="icon"
      />

      <div className="min-h-screen lg:pl-72">
        <MaintenanceBanner
          details={maintenance.details}
          enabled={maintenance.enabled}
          message={maintenance.message}
          onOpen={() => setMaintenanceOpen(true)}
        />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 dark:border-gray-800 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Breadcrumbs pathname={pathname} />
              <h1 className="mt-2 text-2xl font-semibold">{pageTitle}</h1>
            </div>
            {quickActions.length > 0 ? <QuickActions actions={quickActions} pathname={pathname} /> : null}
          </div>
          {children}
        </main>
      </div>

      <CommandPalette commands={commands} onClose={() => setCommandOpen(false)} open={commandOpen} />
      <MaintenanceDialog
        details={maintenance.details}
        message={maintenance.message}
        onClose={() => setMaintenanceOpen(false)}
        open={maintenanceOpen}
      />
      <ToastViewport />
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  const items = segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    isLast: index === segments.length - 1,
    label: routeLabels[segment] ?? titleize(segment),
  }));

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-400">
        <li>
          <Link className="hover:text-[var(--color-primary)]" href="/customers">
            Workspace
          </Link>
        </li>
        {items.map((item) => {
          return (
            <li className="flex items-center gap-2" key={item.href}>
              <span>/</span>
              {item.isLast ? (
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
              ) : (
                <Link className="hover:text-[var(--color-primary)]" href={item.href}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function QuickActions({ actions, pathname }: { actions: Array<{ id: string; label: string; href: string }>; pathname: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          onClick={() => {
            if (pathname === action.href) {
              window.dispatchEvent(new CustomEvent("travox:quick-action", { detail: { actionId: action.id, path: action.href } }));
              notify({ kind: "info", message: `${action.label} will activate when this module is migrated.` });
              return;
            }
            router.push(action.href);
          }}
          size="sm"
          variant="outline"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: ShellNavGroup["items"];
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const filtered = commands.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-20 w-full max-w-2xl overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <Command className="h-4 w-4 text-[var(--color-primary)]" />
          <input
            autoFocus
            className="h-10 flex-1 bg-transparent text-sm outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search workspace routes"
            value={query}
          />
          <Button aria-label="Close command palette" icon={X} onClick={onClose} size="icon" variant="ghost" />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map((item) => (
            <button
              className="block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-[var(--color-primary-soft)] dark:text-gray-200 dark:hover:bg-gray-800"
              key={item.id}
              onClick={() => {
                router.push(item.href);
                onClose();
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
          {filtered.length === 0 ? <p className="px-3 py-8 text-center text-sm text-gray-500">No matching routes.</p> : null}
        </div>
      </div>
    </div>
  );
}

function MaintenanceBanner({
  enabled,
  message,
  details,
  onOpen,
}: {
  enabled: boolean;
  message?: string;
  details?: string;
  onOpen: () => void;
}) {
  if (!enabled) {
    return null;
  }

  return (
    <button
      className="flex w-full items-center justify-center bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
      onClick={onOpen}
      title={details}
      type="button"
    >
      {message ?? "Maintenance Mode"}
    </button>
  );
}

function MaintenanceDialog({
  open,
  message,
  details,
  onClose,
}: {
  open: boolean;
  message?: string;
  details?: string;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-md border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{message ?? "Maintenance Mode"}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {details ?? "Some Travox features may be temporarily unavailable while maintenance is active."}
            </p>
          </div>
          <Button aria-label="Close maintenance details" icon={X} onClick={onClose} size="icon" variant="ghost" />
        </div>
      </section>
    </div>
  );
}

function pageTitleFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "Workspace";
  }

  const last = segments.at(-1) ?? "";
  if (segments.length >= 2 && last === "report") {
    return `${routeLabels[segments[0]] ?? titleize(segments[0])} Report`;
  }
  if (segments[0] === "reports" && segments[1]) {
    return `Report: ${titleize(segments[1])}`;
  }
  return routeLabels[last] ?? routeLabels[segments[0]] ?? titleize(last);
}

function titleize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
