import type { NextRequest } from "next/server";
import { paymentFilterSchema } from "../schemas/payment-schemas";

export function paymentFiltersFromRequest(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return paymentFilterSchema.parse({
    type: params.get("type") || undefined,
    q: params.get("q") || undefined,
    limit: params.get("limit") || undefined,
    offset: params.get("offset") || undefined,
  });
}
