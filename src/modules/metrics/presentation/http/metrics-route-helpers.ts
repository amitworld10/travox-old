import "server-only";
import { requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { CacheMetricsService } from "../../infrastructure/cache-metrics-service";

export async function getCacheMetrics() {
  await requireActor("metrics.read.any");
  return new CacheMetricsService().getSnapshot();
}

export async function resetCacheMetrics() {
  await requireActor("metrics.reset.any");
  return new CacheMetricsService().reset();
}
