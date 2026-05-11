import "server-only";
import { RedisCache } from "@/shared/infrastructure/cache/redis-cache";
import { ConsoleLogger } from "@/shared/infrastructure/logging/console-logger";

export function createDependencyContainer() {
  return {
    cache: new RedisCache(),
    logger: new ConsoleLogger(),
  };
}
