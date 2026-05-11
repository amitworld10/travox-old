import type { NextRequest } from "next/server";
import { createAuthUseCases } from "@/modules/auth/presentation/actions/create-auth-use-cases";
import { accessCookieName, refreshCookieName } from "@/modules/auth/presentation/http/auth-cookies";
import { authErrorResponse, logoutSuccessResponse } from "@/modules/auth/presentation/http/auth-response";
import { getRequestContext } from "@/modules/auth/presentation/http/request-context";

export async function POST(request: NextRequest) {
  try {
    const { logout, getCurrentActor } = createAuthUseCases();
    const refreshToken = request.cookies.get(refreshCookieName())?.value;
    const accessToken = request.cookies.get(accessCookieName())?.value;
    const actor = accessToken ? await getCurrentActor.execute(accessToken).catch(() => null) : null;

    await logout.execute({
      refreshToken,
      userId: actor?.userId,
      orgId: actor?.orgId,
      ...getRequestContext(request),
    });

    return logoutSuccessResponse();
  } catch (error) {
    return authErrorResponse(error, 500);
  }
}
