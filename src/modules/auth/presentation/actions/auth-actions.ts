"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { googleLoginSchema } from "../schemas/auth-schemas";
import { authCookies, expiredAuthCookies, refreshCookieName } from "../http/auth-cookies";
import { createAuthUseCases } from "./create-auth-use-cases";

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function googleLoginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = googleLoginSchema.parse({
    idToken: formData.get("idToken"),
    orgId: formData.get("orgId") || undefined,
  });

  try {
    const { googleLogin } = createAuthUseCases();
    const result = await googleLogin.execute(input);
    const cookieStore = await cookies();

    for (const cookie of authCookies(result)) {
      cookieStore.set(cookie);
    }

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Login failed",
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(refreshCookieName())?.value;

  try {
    const { logout } = createAuthUseCases();
    await logout.execute({ refreshToken });
  } finally {
    for (const cookie of expiredAuthCookies()) {
      cookieStore.set(cookie);
    }
  }

  redirect("/login");
}
