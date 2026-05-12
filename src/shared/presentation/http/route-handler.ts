import "server-only";
import { NextResponse } from "next/server";
import { ConsoleLogger } from "@/shared/infrastructure/logging/console-logger";

const logger = new ConsoleLogger();

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ status: "success", data }, init);
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
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

export async function withRouteLogging(operation: string, handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    const expected =
      error instanceof HttpError ||
      (error instanceof Error && (error.message === "Unauthorized." || error.message.startsWith("Missing permission:")));

    if (!expected) {
      logger.error("Route handler failed", { operation, error: error instanceof Error ? error.message : String(error) });
    }

    return jsonError(error);
  }
}
