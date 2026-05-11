import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getServerEnv } from "@/config/env";
import type {
  GoogleIdentity,
  GoogleIdentityProvider,
} from "../../application/ports/google-identity-provider";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export class GoogleJwksIdentityProvider implements GoogleIdentityProvider {
  async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
    const env = getServerEnv();

    if (!env.GOOGLE_OAUTH_CLIENT_ID) {
      throw new Error("GOOGLE_OAUTH_CLIENT_ID is required for Google sign-in");
    }

    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const email = typeof payload.email === "string" ? payload.email : undefined;
    const providerSub = payload.sub;

    if (!email || !providerSub) {
      throw new Error("Google token is missing required identity claims");
    }

    const allowedDomains = (env.GOOGLE_OAUTH_ALLOWED_DOMAINS ?? "")
      .split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);

    if (allowedDomains.length > 0) {
      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (!emailDomain || !allowedDomains.includes(emailDomain)) {
        throw new Error(`Email domain is not allowed: ${emailDomain ?? "unknown"}`);
      }
    }

    return {
      providerSub,
      email,
      emailVerified: payload.email_verified === true || payload.email_verified === "true",
      name: typeof payload.name === "string" ? payload.name : undefined,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  }
}
