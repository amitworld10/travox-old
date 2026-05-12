import type { NextRequest } from "next/server";
import { PrismaAuditLogRepository } from "@/modules/audit-logs/infrastructure/prisma-audit-log-repository";
import { auditFiltersFromRequest } from "@/modules/audit-logs/presentation/http/audit-log-route-helpers";
import { requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { jsonOk, withRouteLogging } from "@/shared/presentation/http/route-handler";

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string; entityId: string }> }) {
  return withRouteLogging("audit-logs.by-entity", async () => {
    const actor = await requireActor("audit_logs.read.any");
    const { entity, entityId } = await params;
    const filters = auditFiltersFromRequest(request);
    return jsonOk(await new PrismaAuditLogRepository().search(actor, { ...filters, entity, entityId }));
  });
}
