"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import type { ReportColumn, ReportResultDto, ReportRow } from "../../application/report-dto";
import { Badge, StatCard, Table, TableBody, TableCell, TableHeader, TableRow } from "@/shared/presentation/components/server";
import { Button, Pagination } from "@/shared/presentation/components/client";

type Props = {
  result: ReportResultDto;
};

export function ReportTableClient({ result }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return result.data;
    return result.data.filter((row) => Object.values(row).join(" ").toLowerCase().includes(term));
  }, [query, result.data]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totals = Object.entries(result.meta.totals).slice(0, 6);

  return (
    <div className="space-y-5">
      {totals.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {totals.map(([key, value]) => <StatCard key={key} label={humanLabel(key)} value={formatNumber(value)} />)}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input className={inputClass("pl-9")} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search rows" value={query} />
        </label>
        <Button icon={Download} onClick={() => downloadCsv(result.meta.title, result.columns, filtered)} variant="outline">
          Export CSV
        </Button>
      </div>

      {result.meta.notes?.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          {result.meta.notes.map((note) => <p key={note}>{note}</p>)}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>{result.columns.map((column) => <TableCell className={alignClass(column)} header key={column.key}>{column.label}</TableCell>)}</TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row, index) => (
                  <TableRow key={index}>
                    {result.columns.map((column) => <TableCell className={alignClass(column)} key={column.key}>{formatCell(column, row)}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination currentPage={page} itemsPerPage={pageSize} onItemsPerPageChange={setPageSize} onPageChange={setPage} totalItems={filtered.length} />
        </>
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-base font-semibold text-gray-950 dark:text-gray-100">No rows found for the selected filters.</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Adjust the date range or clear the row search.</p>
        </div>
      )}
    </div>
  );
}

function formatCell(column: ReportColumn, row: ReportRow) {
  const value = row[column.key];
  if (value === null || value === undefined || value === "") return "-";
  if (column.type === "currency") return formatMoney(Number(value));
  if (column.type === "number") return formatNumber(Number(value));
  if (column.type === "date") return formatDate(String(value));
  if (column.type === "badge") return <Badge size="sm">{String(value)}</Badge>;
  return String(value);
}

function downloadCsv(title: string, columns: ReportColumn[], rows: ReportRow[]) {
  const header = columns.map((column) => quoteCsv(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => quoteCsv(row[column.key] ?? "")).join(",")).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function quoteCsv(value: unknown) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", maximumFractionDigits: 2, style: "currency" }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function humanLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function alignClass(column: ReportColumn) {
  return column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "";
}

function inputClass(extra = "") {
  return `h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 ${extra}`;
}
