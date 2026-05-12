import type { NextRequest } from "next/server";
import { PrismaAuditLogRepository } from "@/modules/audit-logs/infrastructure/prisma-audit-log-repository";
import { auditFiltersFromRequest } from "@/modules/audit-logs/presentation/http/audit-log-route-helpers";
import { requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { jsonOk, withRouteLogging } from "@/shared/presentation/http/route-handler";

export function GET(request: NextRequest) {
  return withRouteLogging("audit-logs.date-range", async () => {
    const actor = await requireActor("audit_logs.read.any");
    const filters = auditFiltersFromRequest(request);
    return jsonOk(await new PrismaAuditLogRepository().search(actor, filters));
  });
}
