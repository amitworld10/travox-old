import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function RefundsPage() {
  return (
    <ModuleOverviewPage
      description="Inbound vendor refunds and outbound customer refunds will be migrated with payment side effects and reconciliation checks."
      metrics={[
        { label: "Refund Types", value: "Inbound / Outbound" },
        { label: "Boundary", value: "Transaction" },
      ]}
      phase="Iteration 16"
      title="Refunds"
      workflows={["Create inbound refund", "Create outbound refund", "Adjust booking paid and refunded values", "Adjust customer and vendor totals", "Audit refund mutation"]}
    />
  );
}
