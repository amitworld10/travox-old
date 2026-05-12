export type CachePort = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
  getMetrics?(): CacheMetricsDto;
  resetMetrics?(): void;
};

export type CacheMetricsDto = {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalOps: number;
  hitRate: string;
};
