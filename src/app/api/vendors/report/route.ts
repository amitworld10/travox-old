import type { NextRequest } from "next/server";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaReportService } from "@/modules/reports/infrastructure/prisma-report-service";
import { reportFiltersFromRequest } from "@/modules/reports/presentation/http/report-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("reports.read.any");
    const data = await new PrismaReportService().vendorExpenses(actor, reportFiltersFromRequest(request));
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
