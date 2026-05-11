import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function PaymentsPage() {
  return (
    <ModuleOverviewPage
      description="Receivable payment recording, booking due updates, customer spend changes, and money workflow safeguards arrive with the finance migration."
      metrics={[
        { label: "Workflow Type", value: "Receivables" },
        { label: "Boundary", value: "Transaction" },
      ]}
      phase="Iteration 16"
      title="Payments"
      workflows={["Record receivable payment", "Prevent overpayment", "Update booking paid and due", "Update customer total spent", "Audit payment mutation"]}
    />
  );
}
