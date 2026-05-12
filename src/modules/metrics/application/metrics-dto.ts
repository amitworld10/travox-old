export type CacheMetricsSnapshotDto = {
  cache: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    totalOps: number;
    hitRate: string;
  };
  reports: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    totalOps: number;
    hitRate: string;
    keys: number;
  };
  generatedAt: string;
};
