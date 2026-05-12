"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { AuthorizationService } from "@/modules/authorization/application/authorization-service";
import { CacheMetricsService } from "../../infrastructure/cache-metrics-service";

export type MetricsActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function resetCacheMetricsAction(): Promise<MetricsActionResult> {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw new Error("Unauthorized.");
    new AuthorizationService().assertCan(actor, "metrics.reset.any");
    new CacheMetricsService().reset();
    revalidatePath("/logs");
    return { ok: true, message: "Cache metrics reset." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Metrics reset failed." };
  }
}
