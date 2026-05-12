import "server-only";
import { GoogleLoginUseCase } from "../../application/use-cases/google-login.use-case";
import { GetCurrentActorUseCase } from "../../application/use-cases/get-current-actor.use-case";
import { LogoutUseCase } from "../../application/use-cases/logout.use-case";
import { RefreshSessionUseCase } from "../../application/use-cases/refresh-session.use-case";
import { PrismaAuthAudit } from "../../infrastructure/repositories/prisma-auth-audit";
import { PrismaAuthSessionRepository } from "../../infrastructure/repositories/prisma-auth-session-repository";
import { PrismaAuthUserRepository } from "../../infrastructure/repositories/prisma-auth-user-repository";
import { GoogleJwksIdentityProvider } from "../../infrastructure/services/google-jwks-identity-provider";
import { JoseTokenService } from "../../infrastructure/services/jose-token-service";

export function createAuthUseCases() {
  const users = new PrismaAuthUserRepository();
  const sessions = new PrismaAuthSessionRepository();
  const tokens = new JoseTokenService();
  const audit = new PrismaAuthAudit();

  return {
    googleLogin: new GoogleLoginUseCase({
      googleIdentityProvider: new GoogleJwksIdentityProvider(),
      users,
      sessions,
      tokens,
      audit,
    }),
    refreshSession: new RefreshSessionUseCase({
      users,
      sessions,
      tokens,
    }),
    logout: new LogoutUseCase({
      sessions,
      audit,
    }),
    getCurrentActor: new GetCurrentActorUseCase({
      tokens,
      users,
    }),
  };
}
