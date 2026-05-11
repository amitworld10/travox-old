import type { PermissionCode } from "@/modules/authorization/domain/permissions";
import type { RoleCode } from "@/modules/authorization/domain/roles";

export type AuthUserDto = {
  id: string;
  orgId: string;
  email: string;
  name?: string;
  avatar?: string;
  roles: RoleCode[];
  permissions: PermissionCode[];
  isNewUser?: boolean;
};

export type AuthTokenPairDto = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};

export type AuthResultDto = AuthTokenPairDto & {
  user: AuthUserDto;
};

export type GoogleLoginInputDto = {
  idToken: string;
  orgId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RefreshSessionInputDto = {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
};

export type LogoutInputDto = {
  refreshToken?: string;
  userId?: string;
};
