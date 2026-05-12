import "server-only";
import type { AuditAuthEventInput, AuditAuthPort } from "../../application/ports/audit-auth-port";
import { PrismaAuditLogRepository } from "@/modules/audit-logs/infrastructure/prisma-audit-log-repository";

export class PrismaAuthAudit implements AuditAuthPort {
  async recordAuthEvent(input: AuditAuthEventInput): Promise<void> {
    await new PrismaAuditLogRepository().recordSystem({
      orgId: input.orgId,
      actorId: input.actorId,
      entity: "auth",
      entityId: input.actorId,
      action: input.action === "CREATE" ? "CREATE" : input.action,
      diff: {
        before: null,
        after: {
          action: input.action,
          ...input.metadata,
        },
      },
      ip: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
