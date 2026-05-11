import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function ExpensesPage() {
  return (
    <ModuleOverviewPage
      description="Vendor and operational expense workflows will share the finance transaction boundary with payments and refunds."
      metrics={[
        { label: "Workflow Type", value: "Outbound" },
        { label: "Boundary", value: "Transaction" },
      ]}
      phase="Iteration 16"
      title="Expenses"
      workflows={["Record vendor expense", "Resolve destination account", "Update vendor expense totals", "Invalidate reports", "Audit expense mutation"]}
    />
  );
}
