import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import { recordAuditEvent } from "@/modules/audit-logs/application/record-audit-event";
import { toAccountDto } from "@/modules/accounts/infrastructure/prisma-account-repository";
import type { CustomerDto, CustomerInput, CustomerListDto } from "../application/customer-dto";

const includeAccount = { account: true } as const;

type CustomerRecord = Prisma.CustomerGetPayload<{ include: typeof includeAccount }>;

export class PrismaCustomerRepository {
  async list(actor: ActorContext, options: { limit?: number; offset?: number; q?: string } = {}): Promise<CustomerListDto> {
    const where = customerWhere(actor, options.q);
    const take = clampLimit(options.limit);
    const skip = Math.max(0, options.offset ?? 0);

    const [customers, count, aggregates] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: includeAccount,
        orderBy: { updatedAt: "desc" },
        take,
        skip,
      }),
      prisma.customer.count({ where }),
      prisma.customer.aggregate({
        where: { orgId: actor.orgId, isDeleted: false, deletedAt: null },
        _sum: { totalSpent: true },
        _count: { id: true },
      }),
    ]);

    const linkedAccounts = await prisma.customer.count({
      where: { orgId: actor.orgId, isDeleted: false, deletedAt: null, accountId: { not: null } },
    });

    return {
      data: customers.map((customer) => toCustomerDto(customer)),
      count,
      stats: {
        totalCustomers: aggregates._count.id,
        linkedAccounts,
        totalSpent: Number(aggregates._sum.totalSpent ?? 0),
      },
    };
  }

  async findById(actor: ActorContext, id: string): Promise<CustomerDto | null> {
    const customer = await prisma.customer.findFirst({
      where: { id, orgId: actor.orgId, isDeleted: false, deletedAt: null },
      include: includeAccount,
    });

    return customer ? toCustomerDto(customer) : null;
  }

  async create(actor: ActorContext, input: CustomerInput): Promise<CustomerDto> {
    const customer = await prisma.customer.create({
      data: {
        ...input,
        orgId: actor.orgId,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      },
      include: includeAccount,
    });

    const dto = toCustomerDto(customer);
    await recordAuditEvent({ actor, entity: "customers", entityId: dto.id, action: "CREATE", after: dto });
    return dto;
  }

  async update(actor: ActorContext, id: string, input: Partial<CustomerInput>): Promise<CustomerDto> {
    const before = await this.findById(actor, id);
    await this.assertExists(actor, id);
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...input,
        updatedBy: actor.userId,
      },
      include: includeAccount,
    });

    const dto = toCustomerDto(customer);
    await recordAuditEvent({ actor, entity: "customers", entityId: id, action: "UPDATE", before, after: dto });
    return dto;
  }

  async softDelete(actor: ActorContext, id: string): Promise<void> {
    const before = await this.findById(actor, id);
    await this.assertExists(actor, id);
    await prisma.customer.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        archivedAt: new Date(),
        updatedBy: actor.userId,
      },
    });
    await recordAuditEvent({ actor, entity: "customers", entityId: id, action: "DELETE", before });
  }

  async bookings(actor: ActorContext, customerId: string) {
    await this.assertExists(actor, customerId);
    const bookings = await prisma.booking.findMany({
      where: { orgId: actor.orgId, customerId, isDeleted: false, deletedAt: null },
      orderBy: { bookingDate: "desc" },
      take: 25,
      select: {
        id: true,
        bookingDate: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
        primaryPaxName: true,
        packageName: true,
      },
    });

    return bookings.map((booking) => ({
      ...booking,
      bookingDate: booking.bookingDate.toISOString(),
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      dueAmount: Number(booking.dueAmount),
    }));
  }

  private async assertExists(actor: ActorContext, id: string) {
    const count = await prisma.customer.count({
      where: { id, orgId: actor.orgId, isDeleted: false, deletedAt: null },
    });

    if (count === 0) {
      throw new Error("Customer not found.");
    }
  }
}

function customerWhere(actor: ActorContext, q?: string): Prisma.CustomerWhereInput {
  const base: Prisma.CustomerWhereInput = { orgId: actor.orgId, isDeleted: false, deletedAt: null };
  const term = q?.trim();

  if (!term) {
    return base;
  }

  return {
    ...base,
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { passportNo: { contains: term, mode: "insensitive" } },
      { gstin: { contains: term, mode: "insensitive" } },
    ],
  };
}

function clampLimit(limit = 10) {
  return Math.min(Math.max(limit, 1), 100);
}

function maskAadhaar(value: string | null) {
  return value ? `XXXXXXXX${value.slice(-4)}` : "";
}

function maskPassport(value: string | null) {
  if (!value) return "";
  return value.length <= 4 ? "XXXX" : `${value.slice(0, 2)}XXXX${value.slice(-2)}`;
}

export function toCustomerDto(customer: CustomerRecord, unmask = false): CustomerDto {
  return {
    id: customer.id,
    orgId: customer.orgId,
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    passportNo: unmask ? (customer.passportNo ?? "") : maskPassport(customer.passportNo),
    aadhaarNo: unmask ? (customer.aadhaarNo ?? "") : maskAadhaar(customer.aadhaarNo),
    visaNo: customer.visaNo ?? "",
    gstin: customer.gstin ?? "",
    accountId: customer.accountId ?? "",
    account: customer.account ? toAccountDto(customer.account) : null,
    totalBookings: customer.totalBookings,
    totalSpent: Number(customer.totalSpent),
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}
