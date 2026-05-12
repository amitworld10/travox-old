import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { PrismaReportService } from "@/modules/reports/infrastructure/prisma-report-service";
import { ReportFilters } from "@/modules/reports/presentation/components/ReportFilters";
import { ReportTableClient } from "@/modules/reports/presentation/components/ReportTableClient";
import { parseReportFilters } from "@/modules/reports/presentation/schemas/report-schemas";
import { PageHeader } from "@/shared/presentation/components/server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerReportPage({ searchParams }: Props) {
  const actor = await getCurrentActor();
  if (!actor) return null;
  const filters = parseReportFilters(await searchParams);
  const [result, customers] = await Promise.all([
    new PrismaReportService().customerBookings(actor, filters),
    new PrismaCustomerRepository().list(actor, { limit: 100, offset: 0 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Bookings Report" description="Booking, payment, due, and travel context by customer for the selected interval." />
      <ReportFilters actionPath="/customers/report" config={{ id: "customer-report-existing", supportsCustomerFilter: true, supportsPendingOnly: true }} customers={customers.data} filters={filters} />
      <ReportTableClient result={result} />
    </div>
  );
}
