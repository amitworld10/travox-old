import { getCacheMetrics } from "@/modules/metrics/presentation/http/metrics-route-helpers";
import { jsonOk, withRouteLogging } from "@/shared/presentation/http/route-handler";

export function GET() {
  return withRouteLogging("metrics.read", async () => jsonOk(await getCacheMetrics()));
}
