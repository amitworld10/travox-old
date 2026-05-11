import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function CustomersPage() {
  return (
    <ModuleOverviewPage
      description="Customer records, account links, search, imports, booking history, and report entry points move into the Next module in the next iteration."
      links={[{ href: "/customers/report", label: "Customer Report" }]}
      metrics={[
        { label: "Primary Screen", value: "List + Forms" },
        { label: "Data Source", value: "Prisma" },
      ]}
      phase="Iteration 14"
      status="Ready for migration"
      title="Customers"
      workflows={["Customer list and search", "Create and edit customer profile", "Import customers", "View customer bookings", "Open customer report"]}
    />
  );
}
