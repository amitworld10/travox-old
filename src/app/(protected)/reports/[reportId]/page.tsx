import { redirect } from "next/navigation";
import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";
import { getReportCatalogItem, getReportUiConfig } from "@/modules/reports/application/report-catalog";
import { PrismaReportService } from "@/modules/reports/infrastructure/prisma-report-service";
import { ReportFilters } from "@/modules/reports/presentation/components/ReportFilters";
import { ReportTableClient } from "@/modules/reports/presentation/components/ReportTableClient";
import { parseReportFilters, reportIdSchema } from "@/modules/reports/presentation/schemas/report-schemas";
import { PageHeader } from "@/shared/presentation/components/server";

type Props = {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportPage({ params, searchParams }: Props) {
  const actor = await getCurrentActor();
  if (!actor) return null;

  const { reportId: rawReportId } = await params;
  if (rawReportId === "customer-report-existing") redirect("/customers/report");
  if (rawReportId === "vendor-report-existing") redirect("/vendors/report");

  const reportId = reportIdSchema.parse(rawReportId);
  const filters = parseReportFilters(await searchParams);
  const item = getReportCatalogItem(reportId);
  const config = getReportUiConfig(reportId);
  const [result, customers, vendors] = await Promise.all([
    new PrismaReportService().run(actor, reportId, filters),
    config.supportsCustomerFilter ? new PrismaCustomerRepository().list(actor, { limit: 100, offset: 0 }) : Promise.resolve({ data: [] }),
    config.supportsVendorFilter ? new PrismaVendorRepository().list(actor, { limit: 100, offset: 0 }) : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={item?.label ?? result.meta.title} description={item?.description ?? "Run report filters, inspect rows, and export data."} />
      <ReportFilters actionPath={`/reports/${reportId}`} config={config} customers={customers.data} filters={filters} vendors={vendors.data} />
      <ReportTableClient result={result} />
    </div>
  );
}
