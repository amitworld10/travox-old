import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { PrismaReportService } from "@/modules/reports/infrastructure/prisma-report-service";
import { ReportFilters } from "@/modules/reports/presentation/components/ReportFilters";
import { ReportTableClient } from "@/modules/reports/presentation/components/ReportTableClient";
import { parseReportFilters } from "@/modules/reports/presentation/schemas/report-schemas";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";
import { PageHeader } from "@/shared/presentation/components/server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VendorReportPage({ searchParams }: Props) {
  const actor = await getCurrentActor();
  if (!actor) return null;
  const filters = parseReportFilters(await searchParams);
  const [result, vendors] = await Promise.all([
    new PrismaReportService().vendorExpenses(actor, filters),
    new PrismaVendorRepository().list(actor, { limit: 100, offset: 0 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Expense Report" description="Vendor expenses, categories, modes, and totals for the selected interval." />
      <ReportFilters actionPath="/vendors/report" config={{ id: "vendor-report-existing", supportsVendorFilter: true, supportsPaymentModeFilter: true }} filters={filters} vendors={vendors.data} />
      <ReportTableClient result={result} />
    </div>
  );
}
