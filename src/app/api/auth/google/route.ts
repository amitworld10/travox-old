import type { NextRequest } from "next/server";
import { createAuthUseCases } from "@/modules/auth/presentation/actions/create-auth-use-cases";
import { authErrorResponse, authSuccessResponse } from "@/modules/auth/presentation/http/auth-response";
import { getRequestContext } from "@/modules/auth/presentation/http/request-context";
import { googleLoginSchema } from "@/modules/auth/presentation/schemas/auth-schemas";

export async function POST(request: NextRequest) {
  try {
    const body = googleLoginSchema.parse(await request.json());
    const { googleLogin } = createAuthUseCases();
    const result = await googleLogin.execute({
      ...body,
      ...getRequestContext(request),
    });

    return authSuccessResponse(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
