import type { NextRequest } from "next/server";
import { createAuthUseCases } from "@/modules/auth/presentation/actions/create-auth-use-cases";
import { refreshCookieName } from "@/modules/auth/presentation/http/auth-cookies";
import { authErrorResponse, authSuccessResponse } from "@/modules/auth/presentation/http/auth-response";
import { getRequestContext } from "@/modules/auth/presentation/http/request-context";
import { refreshSessionSchema } from "@/modules/auth/presentation/schemas/auth-schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = refreshSessionSchema.parse(body);
    const refreshToken =
      request.cookies.get(refreshCookieName())?.value ??
      parsed.refreshToken ??
      request.headers.get("x-refresh-token") ??
      undefined;

    if (!refreshToken) {
      return authErrorResponse(new Error("Refresh token missing"), 400);
    }

    const { refreshSession } = createAuthUseCases();
    const result = await refreshSession.execute({
      refreshToken,
      ...getRequestContext(request),
    });

    return authSuccessResponse(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
