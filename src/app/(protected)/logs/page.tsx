import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function AuditLogsPage() {
  return (
    <ModuleOverviewPage
      description="Audit log filters, detail review, actor/entity queries, export, and mutation tracking land in the observability iteration."
      metrics={[
        { label: "Owner Surface", value: "Audit" },
        { label: "Export", value: "CSV" },
      ]}
      phase="Iteration 19"
      title="Audit Logs"
      workflows={["Browse audit logs", "Filter by actor", "Filter by entity", "Filter by date range", "Export audit data"]}
    />
  );
}
