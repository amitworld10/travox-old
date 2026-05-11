import { ArrowRight, CheckCircle2, Clock, Layers3 } from "lucide-react";
import Link from "next/link";
import { Badge } from "./Badge";
import { Card, CardContent } from "./Card";
import { PageHeader } from "./PageHeader";
import { StatCard } from "./StatCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./Table";

type OverviewMetric = {
  label: string;
  value: string;
  tone?: "primary" | "neutral" | "success" | "warning";
};

type OverviewLink = {
  label: string;
  href: string;
};

type ModuleOverviewPageProps = {
  title: string;
  description: string;
  phase: string;
  status?: "Ready for migration" | "In progress" | "Planned" | "Quarantined";
  metrics: OverviewMetric[];
  workflows: string[];
  links?: OverviewLink[];
};

export function ModuleOverviewPage({
  title,
  description,
  phase,
  status = "Planned",
  metrics,
  workflows,
  links = [],
}: ModuleOverviewPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          links.length > 0 ? (
            <>
              {links.map((link) => (
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ))}
            </>
          ) : null
        }
        description={description}
        title={title}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Layers3} label="Migration Phase" tone="primary" value={phase} />
        <StatCard icon={Clock} label="Status" tone={status === "In progress" ? "warning" : "neutral"} value={status} />
        {metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} tone={metric.tone} value={metric.value} />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Workflow</TableCell>
                <TableCell className="w-36" header>
                  Readiness
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" />
                      <span className="font-medium">{workflow}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">Queued</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
