import type { ActorContext } from "@/shared/application/actor-context";
import type { PermissionCode } from "../domain/permissions";

export class AuthorizationService {
  can(actor: ActorContext, permission: PermissionCode): boolean {
    return actor.permissions.includes(permission);
  }

  assertCan(actor: ActorContext, permission: PermissionCode): void {
    if (!this.can(actor, permission)) {
      throw new Error(`Missing permission: ${permission}`);
    }
  }
}
