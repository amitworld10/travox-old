import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function CustomerReportPage() {
  return (
    <ModuleOverviewPage
      description="Customer-specific report filters, ledgers, bookings, spend, and export behavior are queued for the reporting iteration."
      links={[{ href: "/customers", label: "Customers" }]}
      metrics={[
        { label: "Report Type", value: "Customer" },
        { label: "Exports", value: "Queued" },
      ]}
      phase="Iteration 17"
      title="Customer Report"
      workflows={["Select customer", "Review bookings and payments", "Compare outstanding balances", "Export report", "Invalidate after customer writes"]}
    />
  );
}
