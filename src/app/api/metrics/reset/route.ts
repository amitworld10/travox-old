import { resetCacheMetrics } from "@/modules/metrics/presentation/http/metrics-route-helpers";
import { jsonOk, withRouteLogging } from "@/shared/presentation/http/route-handler";

export function POST() {
  return withRouteLogging("metrics.reset", async () => jsonOk(await resetCacheMetrics()));
}
