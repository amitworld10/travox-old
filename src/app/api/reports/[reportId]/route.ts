import type { NextRequest } from "next/server";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaReportService } from "@/modules/reports/infrastructure/prisma-report-service";
import { reportFiltersFromRequest } from "@/modules/reports/presentation/http/report-route-helpers";
import { reportIdSchema } from "@/modules/reports/presentation/schemas/report-schemas";

export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const actor = await requireActor("reports.read.any");
    const { reportId: rawReportId } = await params;
    const parsed = reportIdSchema.safeParse(rawReportId);
    if (!parsed.success) throw new RouteError("Report not found.", 404);
    const data = await new PrismaReportService().run(actor, parsed.data, reportFiltersFromRequest(request));
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
