import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/customers",
  "/vendors",
  "/bookings",
  "/payments",
  "/expenses",
  "/refunds",
  "/reports",
  "/logs",
  "/users",
  "/legacy",
];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  const hasAccessCookie = request.cookies.has("travox-at");

  if (isProtectedRoute && !hasAccessCookie) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
