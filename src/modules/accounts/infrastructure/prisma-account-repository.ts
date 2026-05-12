import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import { recordAuditEvent } from "@/modules/audit-logs/application/record-audit-event";
import type { AccountDto, AccountInput } from "../application/account-dto";

export class PrismaAccountRepository {
  async list(actor: ActorContext): Promise<AccountDto[]> {
    const accounts = await prisma.account.findMany({
      where: { orgId: actor.orgId, deletedAt: null, archivedAt: null },
      orderBy: { updatedAt: "desc" },
    });

    return accounts.map(toAccountDto);
  }

  async findById(actor: ActorContext, id: string): Promise<AccountDto | null> {
    const account = await prisma.account.findFirst({
      where: { id, orgId: actor.orgId, deletedAt: null },
    });

    return account ? toAccountDto(account) : null;
  }

  async create(actor: ActorContext, input: AccountInput): Promise<AccountDto> {
    const account = await prisma.account.create({
      data: {
        orgId: actor.orgId,
        bankName: input.bankName,
        ifscCode: input.ifscCode,
        branchName: input.branchName,
        accountNo: input.accountNo,
        upiId: input.upiId,
        isActive: input.isActive ?? true,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      },
    });

    const dto = toAccountDto(account);
    await recordAuditEvent({ actor, entity: "accounts", entityId: dto.id, action: "CREATE", after: dto });
    return dto;
  }

  async update(actor: ActorContext, id: string, input: AccountInput): Promise<AccountDto> {
    const before = await this.findById(actor, id);
    await this.assertExists(actor, id);
    const account = await prisma.account.update({
      where: { id },
      data: {
        bankName: input.bankName,
        ifscCode: input.ifscCode,
        branchName: input.branchName,
        accountNo: input.accountNo,
        upiId: input.upiId,
        isActive: input.isActive,
        updatedBy: actor.userId,
      },
    });

    const dto = toAccountDto(account);
    await recordAuditEvent({ actor, entity: "accounts", entityId: id, action: "UPDATE", before, after: dto });
    return dto;
  }

  async archive(actor: ActorContext, id: string): Promise<void> {
    const before = await this.findById(actor, id);
    await this.assertExists(actor, id);
    await prisma.account.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        isActive: false,
        updatedBy: actor.userId,
      },
    });
    await recordAuditEvent({ actor, entity: "accounts", entityId: id, action: "UPDATE", before, after: { archivedAt: new Date().toISOString(), isActive: false } });
  }

  async softDelete(actor: ActorContext, id: string): Promise<void> {
    const before = await this.findById(actor, id);
    await this.assertExists(actor, id);
    await prisma.account.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        archivedAt: new Date(),
        isActive: false,
        updatedBy: actor.userId,
      },
    });
    await recordAuditEvent({ actor, entity: "accounts", entityId: id, action: "DELETE", before });
  }

  private async assertExists(actor: ActorContext, id: string) {
    const count = await prisma.account.count({
      where: { id, orgId: actor.orgId, deletedAt: null },
    });

    if (count === 0) {
      throw new Error("Account not found.");
    }
  }
}

type AccountRecord = Prisma.AccountGetPayload<Record<string, never>>;

export function toAccountDto(account: AccountRecord): AccountDto {
  return {
    id: account.id,
    orgId: account.orgId,
    bankName: account.bankName ?? "",
    ifscCode: account.ifscCode ?? "",
    branchName: account.branchName ?? "",
    accountNo: account.accountNo ?? "",
    upiId: account.upiId ?? "",
    isActive: account.isActive,
    archivedAt: account.archivedAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
