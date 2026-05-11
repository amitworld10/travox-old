import { PERMISSIONS } from "../domain/permissions";
import { ROLE_PERMISSION_MAP } from "../domain/roles";

export function getAuthorizationSeed() {
  return {
    permissions: PERMISSIONS.map((code) => {
      const [resource, ...rest] = code.split(".");
      return {
        code,
        resource,
        action: rest.slice(0, -1).join("."),
        scope: rest.at(-1) ?? "any",
      };
    }),
    roles: Object.entries(ROLE_PERMISSION_MAP).map(([code, permissions]) => ({
      code,
      name: code,
      permissions,
    })),
  };
}
