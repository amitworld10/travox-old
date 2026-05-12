import "server-only";
import { NextResponse } from "next/server";
import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { AuthorizationService } from "@/modules/authorization/application/authorization-service";
import type { PermissionCode } from "@/modules/authorization/domain/permissions";

export async function requireActor(permission: PermissionCode) {
  const actor = await getCurrentActor();

  if (!actor) {
    throw new RouteError("Unauthorized", 401);
  }

  new AuthorizationService().assertCan(actor, permission);
  return actor;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ status: "success", data }, init);
}

export function fail(error: unknown) {
  if (error instanceof RouteError) {
    return NextResponse.json({ status: "error", message: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.message.startsWith("Missing permission:")) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 403 });
  }

  return NextResponse.json(
    { status: "error", message: error instanceof Error ? error.message : "Request failed." },
    { status: 400 },
  );
}

export class RouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
