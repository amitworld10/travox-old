import { NextResponse } from "next/server";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export function migrationPlaceholder(method: Method, route: string) {
  return NextResponse.json(
    {
      status: "not_implemented",
      method,
      route,
      message: "This route is reserved for the Travox Next.js migration.",
    },
    { status: 501 },
  );
}
