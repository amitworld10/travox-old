import type { PermissionCode } from "@/modules/authorization/domain/permissions";
import type { RoleCode } from "@/modules/authorization/domain/roles";

export type AccessTokenPayload = {
  sub: string;
  orgId: string;
  email?: string;
  name?: string;
  roles: RoleCode[];
  permissions: PermissionCode[];
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
};

export type TokenService = {
  signAccessToken(payload: Omit<AccessTokenPayload, "type">): Promise<string>;
  signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  getAccessTokenExpiryDate(): Date;
  getRefreshTokenExpiryDate(): Date;
};
