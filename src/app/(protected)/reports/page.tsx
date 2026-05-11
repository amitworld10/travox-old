import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function ReportsPage() {
  return (
    <ModuleOverviewPage
      description="The report catalog, runner, filters, exports, and cache-backed totals are scheduled after finance and booking behavior is available."
      links={[
        { href: "/customers/report", label: "Customer Report" },
        { href: "/vendors/report", label: "Vendor Report" },
      ]}
      metrics={[
        { label: "Report Surface", value: "Catalog" },
        { label: "Cache", value: "Redis Port" },
      ]}
      phase="Iteration 17"
      title="Reporting Center"
      workflows={["Browse report catalog", "Run report with filters", "Export report data", "View customer report", "View vendor report"]}
    />
  );
}
