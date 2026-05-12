import type { NextRequest } from "next/server";
import { parseReportFilters } from "../schemas/report-schemas";

export function reportFiltersFromRequest(request: NextRequest) {
  return parseReportFilters(Object.fromEntries(request.nextUrl.searchParams.entries()));
}
