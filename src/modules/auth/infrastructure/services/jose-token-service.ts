import "server-only";
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from "jose";
import { getServerEnv } from "@/config/env";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenService,
} from "../../application/ports/token-service";

const ALG = "RS256";

export class JoseTokenService implements TokenService {
  private readonly env = getServerEnv();

  async signAccessToken(payload: Omit<AccessTokenPayload, "type">): Promise<string> {
    const privateKey = await this.getPrivateKey();

    return new SignJWT({ ...payload, type: "access" })
      .setProtectedHeader({ alg: ALG })
      .setIssuedAt()
      .setIssuer(this.env.AUTH_ISSUER)
      .setSubject(payload.sub)
      .setExpirationTime(`${this.env.AUTH_ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(privateKey);
  }

  async signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): Promise<string> {
    const privateKey = await this.getPrivateKey();

    return new SignJWT({ type: "refresh" })
      .setProtectedHeader({ alg: ALG })
      .setIssuedAt()
      .setIssuer(this.env.AUTH_ISSUER)
      .setSubject(payload.sub)
      .setExpirationTime(`${this.env.AUTH_REFRESH_TOKEN_TTL_SECONDS}s`)
      .sign(privateKey);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const publicKey = await this.getPublicKey();
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: this.env.AUTH_ISSUER,
    });

    if (payload.type !== "access" || !payload.sub || typeof payload.orgId !== "string") {
      throw new Error("Invalid access token");
    }

    return {
      sub: payload.sub,
      type: "access",
      orgId: payload.orgId,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
      roles: Array.isArray(payload.roles) ? (payload.roles as AccessTokenPayload["roles"]) : [],
      permissions: Array.isArray(payload.permissions)
        ? (payload.permissions as AccessTokenPayload["permissions"])
        : [],
    };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const publicKey = await this.getPublicKey();
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: this.env.AUTH_ISSUER,
    });

    if (payload.type !== "refresh" || !payload.sub) {
      throw new Error("Invalid refresh token");
    }

    return {
      sub: payload.sub,
      type: "refresh",
    };
  }

  getAccessTokenExpiryDate(): Date {
    return new Date(Date.now() + this.env.AUTH_ACCESS_TOKEN_TTL_SECONDS * 1000);
  }

  getRefreshTokenExpiryDate(): Date {
    return new Date(Date.now() + this.env.AUTH_REFRESH_TOKEN_TTL_SECONDS * 1000);
  }

  private async getPrivateKey() {
    if (!this.env.AUTH_ACCESS_TOKEN_PRIVATE_KEY) {
      throw new Error("AUTH_ACCESS_TOKEN_PRIVATE_KEY is required for token signing");
    }

    return importPKCS8(this.env.AUTH_ACCESS_TOKEN_PRIVATE_KEY, ALG);
  }

  private async getPublicKey() {
    if (!this.env.AUTH_ACCESS_TOKEN_PUBLIC_KEY) {
      throw new Error("AUTH_ACCESS_TOKEN_PUBLIC_KEY is required for token verification");
    }

    return importSPKI(this.env.AUTH_ACCESS_TOKEN_PUBLIC_KEY, ALG);
  }
}
