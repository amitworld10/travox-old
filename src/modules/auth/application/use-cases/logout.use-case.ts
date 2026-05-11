import type { AuditAuthPort } from "../ports/audit-auth-port";
import type { AuthSessionRepository } from "../ports/auth-session-repository";
import { hashRefreshToken } from "./google-login.use-case";

export type LogoutDependencies = {
  sessions: AuthSessionRepository;
  audit: AuditAuthPort;
};

export class LogoutUseCase {
  constructor(private readonly deps: LogoutDependencies) {}

  async execute(input: {
    refreshToken?: string;
    userId?: string;
    orgId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    if (input.refreshToken) {
      await this.deps.sessions.revokeByRefreshTokenHash(hashRefreshToken(input.refreshToken));
    }

    if (input.userId && input.orgId) {
      await this.deps.audit.recordAuthEvent({
        orgId: input.orgId,
        actorId: input.userId,
        action: "LOGOUT",
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    }
  }
}
