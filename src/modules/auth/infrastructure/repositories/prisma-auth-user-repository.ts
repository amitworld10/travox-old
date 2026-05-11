import "server-only";
import { AuthProvider, Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import { ROLE_PERMISSION_MAP, type RoleCode } from "@/modules/authorization/domain/roles";
import type { PermissionCode } from "@/modules/authorization/domain/permissions";
import {
  type AuthUserRecord,
  type AuthUserRepository,
  type UpsertGoogleUserInput,
  type UpsertGoogleUserResult,
} from "../../application/ports/auth-user-repository";

export class PrismaAuthUserRepository implements AuthUserRepository {
  async findById(id: string): Promise<AuthUserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: userAuthInclude,
    });

    return user ? toAuthUserRecord(user) : null;
  }

  async upsertGoogleUser(input: UpsertGoogleUserInput): Promise<UpsertGoogleUserResult> {
    return prisma.$transaction(async (tx) => {
      await ensureSystemRoles(tx);

      const identity = await tx.authIdentity.findUnique({
        where: {
          provider_providerSub: {
            provider: AuthProvider.GOOGLE,
            providerSub: input.providerSub,
          },
        },
        include: {
          user: {
            include: userAuthInclude,
          },
        },
      });

      if (identity) {
        const user = await tx.user.update({
          where: { id: identity.userId },
          data: {
            name: input.name,
            avatar: input.avatar,
            lastLoginAt: new Date(),
          },
          include: userAuthInclude,
        });

        return { user: toAuthUserRecord(user), isNewUser: false };
      }

      const existingUser = await tx.user.findFirst({
        where: { email: input.email, deletedAt: null },
        include: userAuthInclude,
      });

      if (existingUser) {
        await tx.authIdentity.create({
          data: {
            orgId: existingUser.orgId,
            userId: existingUser.id,
            provider: AuthProvider.GOOGLE,
            providerSub: input.providerSub,
          },
        });

        const user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: input.name ?? existingUser.name,
            avatar: input.avatar ?? existingUser.avatar,
            lastLoginAt: new Date(),
          },
          include: userAuthInclude,
        });

        return { user: toAuthUserRecord(user), isNewUser: false };
      }

      const org = input.orgId
        ? await tx.organization.upsert({
            where: { id: input.orgId },
            create: { id: input.orgId, name: input.orgId },
            update: {},
          })
        : await tx.organization.upsert({
            where: { id: "default" },
            create: { id: "default", name: "default" },
            update: {},
          });

      const existingUserCount = await tx.user.count({
        where: { orgId: org.id, deletedAt: null },
      });
      const roleCode: RoleCode = existingUserCount === 0 ? "Owner" : "Admin";
      const role = await tx.role.findUniqueOrThrow({ where: { code: roleCode } });

      const user = await tx.user.create({
        data: {
          orgId: org.id,
          email: input.email,
          name: input.name,
          avatar: input.avatar,
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
          identities: {
            create: {
              orgId: org.id,
              provider: AuthProvider.GOOGLE,
              providerSub: input.providerSub,
            },
          },
          roles: {
            create: {
              roleId: role.id,
            },
          },
        },
        include: userAuthInclude,
      });

      return { user: toAuthUserRecord(user), isNewUser: true };
    });
  }
}

const userAuthInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} as const;

type UserWithAuth = Prisma.UserGetPayload<{
  include: typeof userAuthInclude;
}>;

function toAuthUserRecord(user: UserWithAuth): AuthUserRecord {
  const roles = user.roles.map(({ role }) => role.code as RoleCode);
  const permissions = [
    ...new Set(
      user.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.code as PermissionCode),
      ),
    ),
  ];

  return {
    id: user.id,
    orgId: user.orgId,
    email: user.email ?? "",
    name: user.name ?? undefined,
    avatar: user.avatar ?? undefined,
    isActive: user.status === UserStatus.ACTIVE,
    roles,
    permissions,
  };
}

async function ensureSystemRoles(tx: Prisma.TransactionClient) {
  for (const [roleCode, permissions] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await tx.role.upsert({
      where: { code: roleCode },
      create: {
        code: roleCode,
        name: roleCode,
        isSystem: true,
      },
      update: {
        name: roleCode,
        isSystem: true,
      },
    });

    for (const permissionCode of permissions) {
      const [resource, ...rest] = permissionCode.split(".");
      const permission = await tx.permission.upsert({
        where: { code: permissionCode },
        create: {
          code: permissionCode,
          resource,
          action: rest.slice(0, -1).join("."),
          scope: rest.at(-1) ?? "any",
        },
        update: {},
      });

      await tx.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
        update: {},
      });
    }
  }
}
