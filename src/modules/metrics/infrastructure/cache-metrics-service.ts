import "server-only";
import { getReportCacheMetrics, resetReportCacheMetrics } from "@/modules/reports/infrastructure/memory-report-cache";
import { RedisCache } from "@/shared/infrastructure/cache/redis-cache";
import type { CacheMetricsSnapshotDto } from "../application/metrics-dto";

const cache = new RedisCache();

export class CacheMetricsService {
  getSnapshot(): CacheMetricsSnapshotDto {
    return {
      cache: cache.getMetrics(),
      reports: getReportCacheMetrics(),
      generatedAt: new Date().toISOString(),
    };
  }

  reset(): CacheMetricsSnapshotDto {
    cache.resetMetrics();
    resetReportCacheMetrics();
    return this.getSnapshot();
  }
}
