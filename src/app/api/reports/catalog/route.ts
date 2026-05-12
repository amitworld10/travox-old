import { getReportCatalog } from "@/modules/reports/application/report-catalog";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET() {
  try {
    await requireActor("reports.read.any");
    const data = getReportCatalog();
    return ok({ data, count: data.length });
  } catch (error) {
    return fail(error);
  }
}
