import "server-only";
import type { AuditAction } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import type { AuditActionDto, AuditLogDto, AuditLogFiltersDto, AuditLogSearchResultDto, AuditLogStatsDto, CreateAuditLogDto } from "../application/audit-log-dto";

type PrismaAuditLog = Awaited<ReturnType<typeof prisma.auditLog.findMany>>[number];

export class PrismaAuditLogRepository {
  async create(actor: ActorContext, data: Omit<CreateAuditLogDto, "actorId"> & { actorId?: string }): Promise<AuditLogDto> {
    const log = await prisma.auditLog.create({
      data: {
        orgId: actor.orgId,
        actorId: data.actorId ?? actor.userId,
        entity: data.entity,
        entityId: data.entityId,
        action: data.action as AuditAction,
        diff: toJsonValue(data.diff),
        ip: data.ip ?? "",
        userAgent: data.userAgent ?? "",
      },
    });

    return this.toDto(log);
  }

  async recordSystem(data: CreateAuditLogDto & { orgId: string }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        orgId: data.orgId,
        actorId: data.actorId,
        entity: data.entity,
        entityId: data.entityId,
        action: data.action as AuditAction,
        diff: toJsonValue(data.diff),
        ip: data.ip ?? "",
        userAgent: data.userAgent ?? "",
      },
    });
  }

  async search(actor: ActorContext, filters: AuditLogFiltersDto): Promise<AuditLogSearchResultDto> {
    const where = whereFromFilters(actor.orgId, filters);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: filters.offset,
        take: filters.limit,
        include: { actor: { select: { email: true, name: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => this.toDto(log)),
      total,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  async stats(actor: ActorContext): Promise<AuditLogStatsDto> {
    const [total, creates, updates, deletes, statusChanges, authEvents] = await Promise.all([
      prisma.auditLog.count({ where: { orgId: actor.orgId } }),
      prisma.auditLog.count({ where: { orgId: actor.orgId, action: "CREATE" } }),
      prisma.auditLog.count({ where: { orgId: actor.orgId, action: "UPDATE" } }),
      prisma.auditLog.count({ where: { orgId: actor.orgId, action: "DELETE" } }),
      prisma.auditLog.count({ where: { orgId: actor.orgId, action: "STATUS_CHANGE" } }),
      prisma.auditLog.count({ where: { orgId: actor.orgId, action: { in: ["LOGIN", "LOGOUT"] } } }),
    ]);

    return { total, creates, updates, deletes, statusChanges, authEvents };
  }

  async exportCsv(actor: ActorContext, filters: AuditLogFiltersDto): Promise<string> {
    const result = await this.search(actor, { ...filters, limit: 5000, offset: 0 });
    const headers = ["ID", "OrgID", "ActorID", "Actor", "Entity", "EntityID", "Action", "IP", "UserAgent", "CreatedAt", "Diff"];
    const rows = result.logs.map((log) => [
      log.id,
      log.orgId,
      log.actorId,
      log.actorLabel,
      log.entity,
      log.entityId,
      log.action,
      log.ip,
      log.userAgent,
      log.createdAt,
      stringifyDiff(log.diff),
    ]);

    return [headers, ...rows].map((row) => row.map(quoteCsv).join(",")).join("\n");
  }

  private toDto(log: PrismaAuditLog & { actor?: { name: string | null; email: string | null } | null }): AuditLogDto {
    return {
      id: log.id,
      orgId: log.orgId,
      actorId: log.actorId,
      actorLabel: log.actor?.name || log.actor?.email || log.actorId,
      entity: log.entity,
      entityId: log.entityId,
      action: log.action as AuditActionDto,
      diff: log.diff,
      ip: log.ip,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    };
  }
}

function whereFromFilters(orgId: string, filters: AuditLogFiltersDto) {
  return {
    orgId,
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
    ...(filters.actorId ? { actorId: filters.actorId } : {}),
    ...(filters.action ? { action: filters.action as AuditAction } : {}),
    ...(filters.startDate || filters.endDate
      ? {
          createdAt: {
            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
            ...(filters.endDate ? { lte: endOfDay(filters.endDate) } : {}),
          },
        }
      : {}),
  };
}

function endOfDay(value: string) {
  const date = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function toJsonValue(value: unknown) {
  if (value === undefined) return {};
  return value as object;
}

function stringifyDiff(diff: unknown) {
  try {
    return JSON.stringify(diff) ?? "";
  } catch {
    return "[Unserializable diff]";
  }
}

function quoteCsv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}
