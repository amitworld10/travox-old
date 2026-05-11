import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function VendorReportPage() {
  return (
    <ModuleOverviewPage
      description="Vendor expense totals, refunds, outstanding values, and exports move with the reporting migration."
      links={[{ href: "/vendors", label: "Vendors" }]}
      metrics={[
        { label: "Report Type", value: "Vendor" },
        { label: "Exports", value: "Queued" },
      ]}
      phase="Iteration 17"
      title="Vendor Report"
      workflows={["Select vendor", "Review expenses and refunds", "Compare vendor totals", "Export report", "Invalidate after vendor writes"]}
    />
  );
}
