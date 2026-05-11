import "server-only";
import { cookies } from "next/headers";
import type { ActorContext } from "@/shared/application/actor-context";
import { createAuthUseCases } from "../actions/create-auth-use-cases";
import { accessCookieName } from "./auth-cookies";

export async function getCurrentActor(): Promise<ActorContext | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName())?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const { getCurrentActor: useCase } = createAuthUseCases();
    return await useCase.execute(accessToken);
  } catch {
    return null;
  }
}
