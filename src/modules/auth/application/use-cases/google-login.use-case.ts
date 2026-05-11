import { createHash } from "node:crypto";
import type { GoogleLoginInputDto, AuthResultDto } from "../dto/auth-dto";
import type { AuditAuthPort } from "../ports/audit-auth-port";
import type { AuthSessionRepository } from "../ports/auth-session-repository";
import type { AuthUserRepository } from "../ports/auth-user-repository";
import type { GoogleIdentityProvider } from "../ports/google-identity-provider";
import type { TokenService } from "../ports/token-service";

export type GoogleLoginDependencies = {
  googleIdentityProvider: GoogleIdentityProvider;
  users: AuthUserRepository;
  sessions: AuthSessionRepository;
  tokens: TokenService;
  audit: AuditAuthPort;
};

export class GoogleLoginUseCase {
  constructor(private readonly deps: GoogleLoginDependencies) {}

  async execute(input: GoogleLoginInputDto): Promise<AuthResultDto> {
    const googleIdentity = await this.deps.googleIdentityProvider.verifyIdToken(input.idToken);

    if (!googleIdentity.emailVerified) {
      throw new Error("Email not verified with Google");
    }

    const { user, isNewUser } = await this.deps.users.upsertGoogleUser({
      orgId: input.orgId,
      providerSub: googleIdentity.providerSub,
      email: googleIdentity.email,
      name: googleIdentity.name,
      avatar: googleIdentity.picture,
    });

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const accessToken = await this.deps.tokens.signAccessToken({
      sub: user.id,
      orgId: user.orgId,
      email: user.email,
      name: user.name,
      roles: user.roles,
      permissions: user.permissions,
    });
    const refreshToken = await this.deps.tokens.signRefreshToken({ sub: user.id });
    const refreshTokenExpiresAt = this.deps.tokens.getRefreshTokenExpiryDate();

    await this.deps.sessions.create({
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    await this.deps.audit.recordAuthEvent({
      orgId: user.orgId,
      actorId: user.id,
      action: isNewUser ? "CREATE" : "LOGIN",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: { loginMethod: "google", isNewUser },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: this.deps.tokens.getAccessTokenExpiryDate(),
      refreshTokenExpiresAt,
      user: {
        id: user.id,
        orgId: user.orgId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        roles: user.roles,
        permissions: user.permissions,
        isNewUser,
      },
    };
  }
}

export function hashRefreshToken(refreshToken: string): string {
  return createHash("sha256").update(refreshToken).digest("hex");
}
