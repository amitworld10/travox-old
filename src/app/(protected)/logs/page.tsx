import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { PrismaAuditLogRepository } from "@/modules/audit-logs/infrastructure/prisma-audit-log-repository";
import { auditLogFilterSchema } from "@/modules/audit-logs/presentation/schemas/audit-log-schemas";
import { AuditLogsPageClient } from "@/modules/audit-logs/presentation/components/AuditLogsPageClient";
import { AuthorizationService } from "@/modules/authorization/application/authorization-service";
import { CacheMetricsService } from "@/modules/metrics/infrastructure/cache-metrics-service";

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await getCurrentActor();
  if (!actor) return null;

  new AuthorizationService().assertCan(actor, "audit_logs.read.any");
  const rawParams = await searchParams;
  const filters = auditLogFilterSchema.parse(flattenParams(rawParams));
  const repo = new PrismaAuditLogRepository();
  const [result, stats] = await Promise.all([repo.search(actor, filters), repo.stats(actor)]);
  const metrics = actor.permissions.includes("metrics.read.any") ? new CacheMetricsService().getSnapshot() : undefined;

  return <AuditLogsPageClient filters={filters} metrics={metrics} result={result} stats={stats} />;
}

function flattenParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
}
