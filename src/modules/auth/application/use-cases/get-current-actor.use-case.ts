import type { ActorContext } from "@/shared/application/actor-context";
import type { AuthUserRepository } from "../ports/auth-user-repository";
import type { TokenService } from "../ports/token-service";

export type GetCurrentActorDependencies = {
  tokens: TokenService;
  users: AuthUserRepository;
};

export class GetCurrentActorUseCase {
  constructor(private readonly deps: GetCurrentActorDependencies) {}

  async execute(accessToken: string): Promise<ActorContext> {
    const decoded = await this.deps.tokens.verifyAccessToken(accessToken);
    const user = await this.deps.users.findById(decoded.sub);

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    return {
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}
