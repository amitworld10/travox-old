import type { NextRequest } from "next/server";
import { createAuditLog, listAuditLogs } from "@/modules/audit-logs/presentation/http/audit-log-route-helpers";
import { jsonOk, withRouteLogging } from "@/shared/presentation/http/route-handler";

export function GET(request: NextRequest) {
  return withRouteLogging("audit-logs.list", async () => jsonOk(await listAuditLogs(request)));
}

export function POST(request: NextRequest) {
  return withRouteLogging("audit-logs.create", async () => jsonOk(await createAuditLog(request), { status: 201 }));
}
