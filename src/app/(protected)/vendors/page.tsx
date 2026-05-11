import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function VendorsPage() {
  return (
    <ModuleOverviewPage
      description="Vendor records, account links, expense summaries, search, forms, and reporting entry points are queued for the master data migration."
      links={[{ href: "/vendors/report", label: "Vendor Report" }]}
      metrics={[
        { label: "Primary Screen", value: "List + Forms" },
        { label: "Data Source", value: "Prisma" },
      ]}
      phase="Iteration 14"
      status="Ready for migration"
      title="Vendors"
      workflows={["Vendor list and search", "Create and edit vendor profile", "Manage account link", "View vendor stats", "Open vendor report"]}
    />
  );
}
