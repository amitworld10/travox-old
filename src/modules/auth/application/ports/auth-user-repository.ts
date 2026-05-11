import type { PermissionCode } from "@/modules/authorization/domain/permissions";
import type { RoleCode } from "@/modules/authorization/domain/roles";

export type AuthUserRecord = {
  id: string;
  orgId: string;
  email: string;
  name?: string;
  avatar?: string;
  isActive: boolean;
  roles: RoleCode[];
  permissions: PermissionCode[];
};

export type UpsertGoogleUserInput = {
  orgId?: string;
  providerSub: string;
  email: string;
  name?: string;
  avatar?: string;
};

export type UpsertGoogleUserResult = {
  user: AuthUserRecord;
  isNewUser: boolean;
};

export type AuthUserRepository = {
  findById(id: string): Promise<AuthUserRecord | null>;
  upsertGoogleUser(input: UpsertGoogleUserInput): Promise<UpsertGoogleUserResult>;
};
