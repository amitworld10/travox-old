import "server-only";
import { ServiceType, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import { recordAuditEvent } from "@/modules/audit-logs/application/record-audit-event";
import { toAccountDto } from "@/modules/accounts/infrastructure/prisma-account-repository";
import type { ServiceTypeLabel, VendorDto, VendorInput, VendorListDto } from "../application/vendor-dto";

const includeAccount = { account: true } as const;

type VendorRecord = Prisma.VendorGetPayload<{ include: typeof includeAccount }>;

export class PrismaVendorRepository {
  async list(actor: ActorContext, options: { limit?: number; offset?: number; q?: string } = {}): Promise<VendorListDto> {
    const where = vendorWhere(actor, options.q);
    const take = clampLimit(options.limit);
    const skip = Math.max(0, options.offset ?? 0);

    const [vendors, count, aggregates, linkedAccounts] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: includeAccount,
        orderBy: { updatedAt: "desc" },
        take,
        skip,
      }),
      prisma.vendor.count({ where }),
      prisma.vendor.aggregate({
        where: { orgId: actor.orgId, isDeleted: false, deletedAt: null },
        _sum: { totalExpense: true },
        _count: { id: true },
      }),
      prisma.vendor.count({
        where: { orgId: actor.orgId, isDeleted: false, deletedAt: null, accountId: { not: null } },
      }),
    ]);

    return {
      data: vendors.map((vendor) => toVendorDto(vendor)),
      count,
      stats: {
        totalVendors: aggregates._count.id,
        linkedAccounts,
        totalExpense: Number(aggregates._sum.totalExpense ?? 0),
      },
    };
  }

  async findById(actor: ActorContext, id: string): Promise<VendorDto | null> {
    const vendor = await prisma.vendor.findFirst({
      where: { id, orgId: actor.orgId, isDeleted: false, deletedAt: null },
      include: includeAccount,
    });

    return vendor ? toVendorDto(vendor) : null;
  }

  async create(actor: ActorContext, input: VendorInput): Promise<VendorDto> {
    const vendor = await prisma.vendor.create({
      data: {
        ...input,
        serviceType: toServiceType(input.serviceType),
        orgId: actor.orgId,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      },
      include: includeAccount,
    });

    const dto = toVendorDto(vendor);
    await recordAuditEvent({ actor, entity: "vendors", entityId: dto.id, action: "CREATE", after: dto });
    return dto;
  }

  async update(actor: ActorContext, id: string, input: Partial<VendorInput>): Promise<VendorDto> {
    const before = await this.findById(actor, id);
    await this.assertExists(actor, id);
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...input,
        serviceType: input.serviceType ? toServiceType(input.serviceType) : undefined,
        updatedBy: actor.userId,
      },
      include: includeAccount,
    });

    const dto = toVendorDto(vendor);
    await recordAuditEvent({ actor, entity: "vendors", entityId: id, action: "UPDATE", before, after: dto });
    return dto;
  }

  async softDelete(actor: ActorContext, id: string): Promise<void> {
    const before = await this.findById(actor, id);
    await this.assertExists(actor, id);
    await prisma.vendor.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        archivedAt: new Date(),
        updatedBy: actor.userId,
      },
    });
    await recordAuditEvent({ actor, entity: "vendors", entityId: id, action: "DELETE", before });
  }

  private async assertExists(actor: ActorContext, id: string) {
    const count = await prisma.vendor.count({
      where: { id, orgId: actor.orgId, isDeleted: false, deletedAt: null },
    });

    if (count === 0) {
      throw new Error("Vendor not found.");
    }
  }
}

function vendorWhere(actor: ActorContext, q?: string): Prisma.VendorWhereInput {
  const base: Prisma.VendorWhereInput = { orgId: actor.orgId, isDeleted: false, deletedAt: null };
  const term = q?.trim();

  if (!term) {
    return base;
  }

  const maybeServiceType = labelToEnum(term);
  return {
    ...base,
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { pocName: { contains: term, mode: "insensitive" } },
      { gstin: { contains: term, mode: "insensitive" } },
      ...(maybeServiceType ? [{ serviceType: maybeServiceType }] : []),
    ],
  };
}

function clampLimit(limit = 10) {
  return Math.min(Math.max(limit, 1), 100);
}

function labelToEnum(value: string): ServiceType | null {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  return normalized in ServiceType ? (normalized as ServiceType) : null;
}

function toServiceType(value: ServiceTypeLabel): ServiceType {
  const normalized = value.toUpperCase().replace(/\s+/g, "_");
  if (normalized in ServiceType) {
    return normalized as ServiceType;
  }
  throw new Error("Unsupported service type.");
}

function fromServiceType(value: ServiceType): ServiceTypeLabel {
  const label = value.toLowerCase().replace(/(^|_)(\w)/g, (_match, _sep: string, char: string) => char.toUpperCase());
  return (label === "Dmc" ? "DMC" : label) as ServiceTypeLabel;
}

function maskGstin(value: string | null) {
  if (!value) return "";
  return value.length <= 4 ? "XXXX" : `${value.slice(0, 2)}XXXX${value.slice(-4)}`;
}

export function toVendorDto(vendor: VendorRecord, unmask = false): VendorDto {
  return {
    id: vendor.id,
    orgId: vendor.orgId,
    name: vendor.name,
    serviceType: fromServiceType(vendor.serviceType),
    pocName: vendor.pocName ?? "",
    phone: vendor.phone ?? "",
    email: vendor.email ?? "",
    gstin: unmask ? (vendor.gstin ?? "") : maskGstin(vendor.gstin),
    accountId: vendor.accountId ?? "",
    account: vendor.account ? toAccountDto(vendor.account) : null,
    totalExpense: Number(vendor.totalExpense),
    totalBookings: vendor.totalBookings,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
  };
}
