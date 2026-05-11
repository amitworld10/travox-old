import { PERMISSIONS, type PermissionCode } from "./permissions";

export const ROLE_CODES = ["Owner", "Admin"] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

const adminPermissions = PERMISSIONS.filter(
  (permission) =>
    !permission.startsWith("audit_logs.") &&
    permission !== "metrics.reset.any" &&
    !permission.startsWith("users.role.") &&
    !permission.startsWith("users.status."),
);

export const ROLE_PERMISSION_MAP: Record<RoleCode, PermissionCode[]> = {
  Owner: [...PERMISSIONS],
  Admin: adminPermissions,
};
