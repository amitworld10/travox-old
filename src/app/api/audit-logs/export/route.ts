import type { NextRequest } from "next/server";
import { PrismaAuditLogRepository } from "@/modules/audit-logs/infrastructure/prisma-audit-log-repository";
import { auditFiltersFromRequest } from "@/modules/audit-logs/presentation/http/audit-log-route-helpers";
import { requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { withRouteLogging } from "@/shared/presentation/http/route-handler";

export function GET(request: NextRequest) {
  return withRouteLogging("audit-logs.export", async () => {
    const actor = await requireActor("audit_logs.export.any");
    const csv = await new PrismaAuditLogRepository().exportCsv(actor, auditFiltersFromRequest(request));
    return new Response(csv, {
      headers: {
        "content-disposition": 'attachment; filename="audit-logs.csv"',
        "content-type": "text/csv; charset=utf-8",
      },
    });
  });
}
