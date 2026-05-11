import { NextResponse } from "next/server";
import type { AuthResultDto } from "../../application/dto/auth-dto";
import { authCookies, expiredAuthCookies } from "./auth-cookies";

export function authSuccessResponse(result: AuthResultDto) {
  const response = NextResponse.json({
    status: "success",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });

  for (const cookie of authCookies(result)) {
    response.cookies.set(cookie);
  }

  return response;
}

export function logoutSuccessResponse() {
  const response = NextResponse.json({
    status: "success",
    data: { message: "Logged out successfully" },
  });

  for (const cookie of expiredAuthCookies()) {
    response.cookies.set(cookie);
  }

  return response;
}

export function authErrorResponse(error: unknown, status = 401) {
  const message = error instanceof Error ? error.message : "Authentication failed";

  return NextResponse.json(
    {
      status: "error",
      data: { message },
    },
    { status },
  );
}
