import "server-only";
import type { ReportCachePort } from "../domain/report-cache";

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const store = new Map<string, CacheEntry>();
const metrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

export class MemoryReportCache implements ReportCachePort {
  async get<T>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) {
      metrics.misses += 1;
      return null;
    }
    if (entry.expiresAt < Date.now()) {
      store.delete(key);
      metrics.misses += 1;
      return null;
    }
    metrics.hits += 1;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    metrics.sets += 1;
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        store.delete(key);
        metrics.deletes += 1;
      }
    }
  }
}

export function getReportCacheMetrics() {
  const totalOps = metrics.hits + metrics.misses;
  return {
    ...metrics,
    keys: store.size,
    totalOps,
    hitRate: totalOps > 0 ? `${((metrics.hits / totalOps) * 100).toFixed(2)}%` : "0.00%",
  };
}

export function resetReportCacheMetrics() {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.sets = 0;
  metrics.deletes = 0;
  metrics.errors = 0;
}
