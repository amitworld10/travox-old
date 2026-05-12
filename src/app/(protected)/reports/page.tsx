import { getReportCatalog } from "@/modules/reports/application/report-catalog";
import { ReportsCenterClient } from "@/modules/reports/presentation/components/ReportsCenterClient";

export default function ReportsPage() {
  return <ReportsCenterClient catalog={getReportCatalog()} />;
}
