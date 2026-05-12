import "server-only";
import type { CacheMetricsDto, CachePort } from "@/shared/application/ports/cache-port";

const metrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

export class RedisCache implements CachePort {
  async get<T>(key: string): Promise<T | null> {
    void key;
    metrics.misses += 1;
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    void key;
    void value;
    void ttlSeconds;
    metrics.sets += 1;
    return undefined;
  }

  async delete(key: string): Promise<void> {
    void key;
    metrics.deletes += 1;
    return undefined;
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    void prefix;
    metrics.deletes += 1;
    return undefined;
  }

  getMetrics(): CacheMetricsDto {
    return toMetricsDto();
  }

  resetMetrics(): void {
    metrics.hits = 0;
    metrics.misses = 0;
    metrics.sets = 0;
    metrics.deletes = 0;
    metrics.errors = 0;
  }
}

function toMetricsDto(): CacheMetricsDto {
  const totalOps = metrics.hits + metrics.misses;
  return {
    ...metrics,
    totalOps,
    hitRate: totalOps > 0 ? `${((metrics.hits / totalOps) * 100).toFixed(2)}%` : "0.00%",
  };
}
