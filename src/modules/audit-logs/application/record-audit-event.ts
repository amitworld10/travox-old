import "server-only";
import type { ActorContext } from "@/shared/application/actor-context";
import { PrismaAuditLogRepository } from "../infrastructure/prisma-audit-log-repository";
import type { AuditActionDto } from "./audit-log-dto";

export async function recordAuditEvent(input: {
  actor: ActorContext;
  entity: string;
  entityId: string;
  action: AuditActionDto;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  await new PrismaAuditLogRepository().create(input.actor, {
    entity: input.entity,
    entityId: input.entityId,
    action: input.action,
    diff: {
      before: input.before ?? null,
      after: input.after ?? null,
    },
  });
}
