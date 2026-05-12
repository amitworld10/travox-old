"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Search } from "lucide-react";
import type { ReportCatalogItem } from "../../application/report-dto";
import { Badge, PageHeader } from "@/shared/presentation/components/server";

type Props = {
  catalog: ReportCatalogItem[];
};

const categoryOrder = ["Sales", "Customers", "Vendors", "Transactions", "Refunds", "Existing"];

export function ReportsCenterClient({ catalog }: Props) {
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = catalog.filter((item) => !term || [item.label, item.description, item.category].join(" ").toLowerCase().includes(term));
    return categoryOrder
      .map((category) => ({ category, reports: filtered.filter((item) => item.category === category) }))
      .filter((group) => group.reports.length > 0);
  }, [catalog, query]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reporting Center" description="Run operational and accounting-style reports with date filters, totals, tables, and CSV exports." />
      <label className="relative block rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <Search className="pointer-events-none absolute left-7 top-7 h-4 w-4 text-gray-400" />
        <input className={inputClass("pl-9")} onChange={(event) => setQuery(event.target.value)} placeholder="Search report by name, category, or description" value={query} />
      </label>
      {grouped.map((group) => (
        <section className="space-y-3" key={group.category}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{group.category}</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {group.reports.map((report) => (
              <Link className="rounded-md border border-gray-200 bg-white p-4 transition hover:border-[var(--color-primary)] hover:shadow-sm dark:border-gray-800 dark:bg-gray-900" href={report.route} key={report.id}>
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-md bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"><BarChart3 className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-gray-950 dark:text-gray-100">{report.label}</strong>
                      {report.existing ? <Badge size="sm">Existing</Badge> : null}
                      {report.experimental ? <Badge size="sm" variant="warning">Derived</Badge> : null}
                    </span>
                    <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">{report.description}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      {grouped.length === 0 ? <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">No reports matched your search.</div> : null}
    </div>
  );
}

function inputClass(extra = "") {
  return `h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 ${extra}`;
}
