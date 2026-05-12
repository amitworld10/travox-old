import "server-only";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import type { OrganizationDto } from "../application/organization-dto";

export class PrismaOrganizationRepository {
  async current(actor: ActorContext): Promise<OrganizationDto | null> {
    const org = await prisma.organization.findFirst({
      where: { id: actor.orgId, deletedAt: null },
    });

    return org
      ? {
          id: org.id,
          name: org.name,
          createdAt: org.createdAt.toISOString(),
          updatedAt: org.updatedAt.toISOString(),
        }
      : null;
  }
}
