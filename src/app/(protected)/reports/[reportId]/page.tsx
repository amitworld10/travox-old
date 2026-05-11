import { ModuleOverviewPage } from "@/shared/presentation/components/server";

type ReportPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { reportId } = await params;

  return (
    <ModuleOverviewPage
      description="Dynamic report execution, filter parsing, cache keys, and exports will be implemented when report use cases are migrated."
      links={[{ href: "/reports", label: "Reporting Center" }]}
      metrics={[
        { label: "Report ID", value: reportId },
        { label: "Runner", value: "Queued" },
      ]}
      phase="Iteration 17"
      title={`Report: ${reportId}`}
      workflows={["Load report definition", "Validate filters", "Run report use case", "Render result table", "Export result"]}
    />
  );
}
