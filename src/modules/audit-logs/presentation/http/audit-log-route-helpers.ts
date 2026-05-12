import "server-only";
import type { NextRequest } from "next/server";
import { getRequestContext } from "@/modules/auth/presentation/http/request-context";
import { requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaAuditLogRepository } from "../../infrastructure/prisma-audit-log-repository";
import { auditLogFilterSchema, createAuditLogSchema } from "../schemas/audit-log-schemas";

export function auditFiltersFromRequest(request: NextRequest) {
  return auditLogFilterSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
}

export async function listAuditLogs(request: NextRequest) {
  const actor = await requireActor("audit_logs.read.any");
  return new PrismaAuditLogRepository().search(actor, auditFiltersFromRequest(request));
}

export async function createAuditLog(request: NextRequest) {
  const actor = await requireActor("audit_logs.read.any");
  const data = createAuditLogSchema.parse(await request.json());
  const context = getRequestContext(request);
  return new PrismaAuditLogRepository().create(actor, {
    ...data,
    actorId: data.actorId ?? actor.userId,
    ip: context.ipAddress,
    userAgent: context.userAgent,
  });
}
