import "server-only";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { getServerEnv } from "@/config/env";
import type { AuthTokenPairDto } from "../../application/dto/auth-dto";

export function accessCookieName() {
  return getServerEnv().AUTH_ACCESS_COOKIE_NAME;
}

export function refreshCookieName() {
  return getServerEnv().AUTH_REFRESH_COOKIE_NAME;
}

export function accessCookie(token: string, expires: Date): ResponseCookie {
  return cookie(accessCookieName(), token, expires);
}

export function refreshCookie(token: string, expires: Date): ResponseCookie {
  return cookie(refreshCookieName(), token, expires);
}

export function authCookies(tokens: AuthTokenPairDto): ResponseCookie[] {
  return [
    accessCookie(tokens.accessToken, tokens.accessTokenExpiresAt),
    refreshCookie(tokens.refreshToken, tokens.refreshTokenExpiresAt),
  ];
}

export function expiredAuthCookies(): ResponseCookie[] {
  const expired = new Date(0);
  return [cookie(accessCookieName(), "", expired), cookie(refreshCookieName(), "", expired)];
}

function cookie(name: string, value: string, expires: Date): ResponseCookie {
  const env = getServerEnv();

  return {
    name,
    value,
    expires,
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    domain: env.AUTH_COOKIE_DOMAIN || undefined,
    path: "/",
  };
}
