"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, RotateCcw, Search } from "lucide-react";
import type { AuditLogDto, AuditLogSearchResultDto, AuditLogStatsDto } from "../../application/audit-log-dto";
import type { CacheMetricsSnapshotDto } from "@/modules/metrics/application/metrics-dto";
import { resetCacheMetricsAction } from "@/modules/metrics/presentation/actions/metrics-actions";
import { Badge, Card, PageHeader, StatCard, Table, TableBody, TableCell, TableHeader, TableRow } from "@/shared/presentation/components/server";
import { Button, Modal, Pagination, notify } from "@/shared/presentation/components/client";

type Props = {
  result: AuditLogSearchResultDto;
  stats: AuditLogStatsDto;
  metrics?: CacheMetricsSnapshotDto;
  filters: {
    entity?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  };
};

const actions = ["", "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "LOGIN", "LOGOUT", "ROLE_CHANGE", "PERMISSION_CHANGE"];

export function AuditLogsPageClient({ result, stats, metrics, filters }: Props) {
  const [selected, setSelected] = useState<AuditLogDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const page = Math.floor(result.offset / result.limit) + 1;
  const exportHref = useMemo(() => `/api/audit-logs/export?${new URLSearchParams(cleanFilters(filters)).toString()}`, [filters]);

  const resetMetrics = () => {
    startTransition(async () => {
      const outcome = await resetCacheMetricsAction();
      notify({ message: outcome.message, kind: outcome.ok ? "success" : "error" });
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader description="Review critical workspace mutations, auth events, actor/entity history, and cache health from the migrated Next.js runtime." title="Audit Logs" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Total Events" value={String(stats.total)} />
        <StatCard label="Creates" value={String(stats.creates)} />
        <StatCard label="Updates" value={String(stats.updates)} />
        <StatCard label="Deletes" value={String(stats.deletes)} />
        <StatCard label="Status Changes" value={String(stats.statusChanges)} />
        <StatCard label="Auth Events" value={String(stats.authEvents)} />
      </div>

      {metrics ? (
        <Card className="p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-gray-950 dark:text-gray-100">Cache Metrics</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Hits" value={metrics.cache.hits + metrics.reports.hits} />
                <Metric label="Misses" value={metrics.cache.misses + metrics.reports.misses} />
                <Metric label="Sets" value={metrics.cache.sets + metrics.reports.sets} />
                <Metric label="Errors" value={metrics.cache.errors + metrics.reports.errors} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-950 dark:text-gray-100">Report Cache</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Keys" value={metrics.reports.keys} />
                <Metric label="Hit Rate" value={metrics.reports.hitRate} />
                <Metric label="Deletes" value={metrics.reports.deletes} />
                <Metric label="Generated" value={formatTime(metrics.generatedAt)} />
              </div>
            </div>
            <Button disabled={isPending} icon={RotateCcw} onClick={resetMetrics} type="button" variant="outline">
              Reset Metrics
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <Field label="Entity" name="entity" placeholder="customers" value={filters.entity} />
          <Field label="Entity ID" name="entityId" placeholder="Record ID" value={filters.entityId} />
          <Field label="Actor ID" name="actorId" placeholder="User ID" value={filters.actorId} />
          <label className="grid gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Action
            <select className={inputClass()} defaultValue={filters.action ?? ""} name="action">
              {actions.map((action) => (
                <option key={action || "all"} value={action}>
                  {action || "All actions"}
                </option>
              ))}
            </select>
          </label>
          <Field label="From" name="startDate" type="date" value={filters.startDate} />
          <Field label="To" name="endDate" type="date" value={filters.endDate} />
          <div className="flex gap-2">
            <Button icon={Search} type="submit">Filter</Button>
            <a className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800" href={exportHref}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </a>
          </div>
        </form>
      </Card>

      {result.logs.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Time</TableCell>
                <TableCell header>Action</TableCell>
                <TableCell header>Entity</TableCell>
                <TableCell header>Actor</TableCell>
                <TableCell header>Source</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.logs.map((log) => (
                <TableRow key={log.id} onClick={() => setSelected(log)}>
                  <TableCell>
                    <div className="whitespace-nowrap text-sm">{formatDate(log.createdAt)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(log.createdAt)}</div>
                  </TableCell>
                  <TableCell><Badge size="sm">{humanLabel(log.action)}</Badge></TableCell>
                  <TableCell>
                    <div className="font-medium">{log.entity}</div>
                    <div className="max-w-56 truncate text-xs text-gray-500 dark:text-gray-400">{log.entityId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-56 truncate">{log.actorLabel}</div>
                    <div className="max-w-56 truncate text-xs text-gray-500 dark:text-gray-400">{log.actorId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate text-xs">{log.ip || "-"}</div>
                    <div className="max-w-48 truncate text-xs text-gray-500 dark:text-gray-400">{log.userAgent || "-"}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-gray-200 p-4 dark:border-gray-800">
            <Pagination currentPage={page} itemsPerPage={result.limit} onItemsPerPageChange={() => undefined} onPageChange={(nextPage) => goToPage(nextPage, result.limit, filters)} totalItems={result.total} />
          </div>
        </Card>
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-base font-semibold text-gray-950 dark:text-gray-100">No audit events match these filters.</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Clear filters or broaden the date range.</p>
        </div>
      )}

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Audit Detail">
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Action" value={humanLabel(selected.action)} />
              <Detail label="Entity" value={`${selected.entity} / ${selected.entityId}`} />
              <Detail label="Actor" value={`${selected.actorLabel} (${selected.actorId})`} />
              <Detail label="Created" value={`${formatDate(selected.createdAt)} ${formatTime(selected.createdAt)}`} />
            </div>
            <pre className="max-h-96 overflow-auto rounded-md bg-gray-950 p-4 text-xs text-gray-100">{JSON.stringify(selected.diff, null, 2)}</pre>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Field({ label, name, placeholder, type = "text", value }: { label: string; name: string; placeholder?: string; type?: string; value?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <input className={inputClass()} defaultValue={value ?? ""} name={name} placeholder={placeholder} type={type} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-gray-100">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm text-gray-950 dark:text-gray-100">{value}</p>
    </div>
  );
}

function cleanFilters(filters: Props["filters"]) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))) as Record<string, string>;
}

function goToPage(page: number, limit: number, filters: Props["filters"]) {
  const params = new URLSearchParams({ ...cleanFilters(filters), limit: String(limit), offset: String((page - 1) * limit) });
  window.location.href = `/logs?${params.toString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function humanLabel(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function inputClass() {
  return "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";
}
