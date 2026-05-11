import type { AuthResultDto, RefreshSessionInputDto } from "../dto/auth-dto";
import type { AuthSessionRepository } from "../ports/auth-session-repository";
import type { AuthUserRepository } from "../ports/auth-user-repository";
import type { TokenService } from "../ports/token-service";
import { hashRefreshToken } from "./google-login.use-case";

export type RefreshSessionDependencies = {
  users: AuthUserRepository;
  sessions: AuthSessionRepository;
  tokens: TokenService;
};

export class RefreshSessionUseCase {
  constructor(private readonly deps: RefreshSessionDependencies) {}

  async execute(input: RefreshSessionInputDto): Promise<AuthResultDto> {
    const decoded = await this.deps.tokens.verifyRefreshToken(input.refreshToken);
    const refreshTokenHash = hashRefreshToken(input.refreshToken);
    const session = await this.deps.sessions.findByRefreshTokenHash(refreshTokenHash);

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new Error("Refresh token revoked or not found");
    }

    const user = await this.deps.users.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    await this.deps.sessions.revokeByRefreshTokenHash(refreshTokenHash);

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
      },
    };
  }
}
