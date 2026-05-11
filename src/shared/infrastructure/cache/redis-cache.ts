import "server-only";
import type { CachePort } from "@/shared/application/ports/cache-port";

export class RedisCache implements CachePort {
  async get<T>(key: string): Promise<T | null> {
    void key;
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    void key;
    void value;
    void ttlSeconds;
    return undefined;
  }

  async delete(key: string): Promise<void> {
    void key;
    return undefined;
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    void prefix;
    return undefined;
  }
}
