import "server-only";
import { BookingStatus, PaymentMode, PaymentType, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import { recordAuditEvent } from "@/modules/audit-logs/application/record-audit-event";
import { toAccountDto } from "@/modules/accounts/infrastructure/prisma-account-repository";
import type {
  ExpensePaymentInput,
  PaymentDto,
  PaymentFilterInput,
  PaymentListDto,
  PaymentStatsDto,
  PaymentTypeLabel,
  ReceivablePaymentInput,
  RefundPaymentInput,
} from "../application/payment-dto";

const paymentInclude = {
  booking: { include: { customer: true, vendor: true } },
  customer: true,
  vendor: true,
  fromAccount: true,
  toAccount: true,
  refundOfPayment: true,
  refunds: true,
} as const;

type PaymentRecord = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;
type Tx = Prisma.TransactionClient;

export class PrismaPaymentRepository {
  async list(actor: ActorContext, filters: PaymentFilterInput = {}): Promise<PaymentListDto> {
    const where = paymentWhere(actor, filters);
    const take = clampLimit(filters.limit);
    const skip = Math.max(0, filters.offset ?? 0);
    const [payments, count, stats] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: paymentInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.payment.count({ where }),
      this.stats(actor),
    ]);

    return { data: payments.map(toPaymentDto), count, stats };
  }

  async findById(actor: ActorContext, id: string): Promise<PaymentDto | null> {
    const payment = await prisma.payment.findFirst({
      where: activePaymentWhere(actor, id),
      include: paymentInclude,
    });

    return payment ? toPaymentDto(payment) : null;
  }

  async createReceivable(actor: ActorContext, input: ReceivablePaymentInput): Promise<PaymentDto> {
    const payment = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: input.bookingId, orgId: actor.orgId, isDeleted: false, deletedAt: null },
        include: { customer: true },
      });
      if (!booking) throw new Error("Booking not found.");
      if (Number(booking.dueAmount) < input.amount) throw new Error("Receivable payment cannot exceed booking due amount.");

      const fromAccountId = valueOrUndefined(input.fromAccountId) ?? booking.customer.accountId;
      if (!fromAccountId) throw new Error("Customer must have a linked account before recording a receivable.");
      await assertCustomerAccount(tx, actor.orgId, booking.customerId, fromAccountId);

      const payment = await tx.payment.create({
        data: {
          orgId: actor.orgId,
          paymentType: PaymentType.RECEIVABLE,
          amount: input.amount,
          currency: booking.currency,
          paymentMode: toPaymentMode(input.paymentMode),
          bookingId: booking.id,
          customerId: booking.customerId,
          receiptNo: valueOrUndefined(input.receiptNo),
          notes: valueOrUndefined(input.notes),
          fromAccountId,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        include: paymentInclude,
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paidAmount: { increment: input.amount },
          dueAmount: { decrement: input.amount },
          updatedBy: actor.userId,
        },
      });
      await tx.customer.update({
        where: { id: booking.customerId },
        data: { totalSpent: { increment: input.amount }, updatedBy: actor.userId },
      });

      return toPaymentDto(payment);
    });
    await recordAuditEvent({ actor, entity: "payments", entityId: payment.id, action: "CREATE", after: payment });
    return payment;
  }

  async createExpense(actor: ActorContext, input: ExpensePaymentInput): Promise<PaymentDto> {
    const payment = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.findFirst({
        where: { orgId: actor.orgId, accountId: input.toAccountId, isDeleted: false, deletedAt: null },
      });
      if (!vendor) throw new Error("Destination account is not linked to an active vendor.");
      if (input.fromAccountId) await assertActiveAccount(tx, actor.orgId, input.fromAccountId);

      const payment = await tx.payment.create({
        data: {
          orgId: actor.orgId,
          paymentType: PaymentType.EXPENSE,
          amount: input.amount,
          currency: "INR",
          paymentMode: toPaymentMode(input.paymentMode),
          vendorId: vendor.id,
          category: valueOrUndefined(input.category),
          notes: valueOrUndefined(input.notes),
          receiptNo: valueOrUndefined(input.receiptNo),
          fromAccountId: valueOrUndefined(input.fromAccountId),
          toAccountId: input.toAccountId,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        include: paymentInclude,
      });

      await tx.vendor.update({
        where: { id: vendor.id },
        data: { totalExpense: { increment: input.amount }, updatedBy: actor.userId },
      });

      return toPaymentDto(payment);
    });
    await recordAuditEvent({ actor, entity: "payments", entityId: payment.id, action: "CREATE", after: payment });
    return payment;
  }

  async createOutboundRefund(actor: ActorContext, input: RefundPaymentInput): Promise<PaymentDto> {
    const payment = await prisma.$transaction(async (tx) => {
      const original = await this.requireOriginal(tx, actor, input.refundOfPaymentId, PaymentType.RECEIVABLE);
      const amount = refundAmount(original, input.amount, PaymentType.REFUND_OUTBOUND);

      const payment = await tx.payment.create({
        data: {
          orgId: actor.orgId,
          paymentType: PaymentType.REFUND_OUTBOUND,
          amount,
          currency: original.currency,
          paymentMode: toPaymentMode(input.paymentMode),
          bookingId: original.bookingId,
          customerId: original.customerId,
          refundOfPaymentId: original.id,
          receiptNo: valueOrUndefined(input.receiptNo),
          notes: valueOrUndefined(input.notes),
          toAccountId: original.fromAccountId,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        include: paymentInclude,
      });

      if (original.customerId) {
        await tx.customer.update({
          where: { id: original.customerId },
          data: { totalSpent: { decrement: amount }, updatedBy: actor.userId },
        });
      }
      if (original.bookingId) {
        const booking = await tx.booking.findUnique({ where: { id: original.bookingId } });
        if (booking) {
          const paidAmount = Math.max(0, Number(booking.paidAmount) - amount);
          await tx.booking.update({
            where: { id: original.bookingId },
            data: {
              paidAmount,
              refundedAmount: { increment: amount },
              status: paidAmount === 0 ? BookingStatus.REFUNDED : undefined,
              dueAmount: paidAmount === 0 ? 0 : undefined,
              updatedBy: actor.userId,
            },
          });
        }
      }

      return toPaymentDto(payment);
    });
    await recordAuditEvent({ actor, entity: "payments", entityId: payment.id, action: "CREATE", after: payment });
    return payment;
  }

  async createInboundRefund(actor: ActorContext, input: RefundPaymentInput): Promise<PaymentDto> {
    const payment = await prisma.$transaction(async (tx) => {
      const original = await this.requireOriginal(tx, actor, input.refundOfPaymentId, PaymentType.EXPENSE);
      const amount = refundAmount(original, input.amount, PaymentType.REFUND_INBOUND);

      const payment = await tx.payment.create({
        data: {
          orgId: actor.orgId,
          paymentType: PaymentType.REFUND_INBOUND,
          amount,
          currency: original.currency,
          paymentMode: toPaymentMode(input.paymentMode),
          vendorId: original.vendorId,
          refundOfPaymentId: original.id,
          receiptNo: valueOrUndefined(input.receiptNo),
          notes: valueOrUndefined(input.notes),
          fromAccountId: original.toAccountId,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        include: paymentInclude,
      });

      if (original.vendorId) {
        await tx.vendor.update({
          where: { id: original.vendorId },
          data: { totalExpense: { decrement: amount }, updatedBy: actor.userId },
        });
      }

      return toPaymentDto(payment);
    });
    await recordAuditEvent({ actor, entity: "payments", entityId: payment.id, action: "CREATE", after: payment });
    return payment;
  }

  async stats(actor: ActorContext): Promise<PaymentStatsDto> {
    const where = { orgId: actor.orgId, isDeleted: false, deletedAt: null };
    const [count, groups] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ["paymentType"],
        where,
        _sum: { amount: true },
      }),
    ]);

    const sums = Object.fromEntries(groups.map((group) => [group.paymentType, Number(group._sum.amount ?? 0)]));
    return {
      receivableTotal: sums.RECEIVABLE ?? 0,
      expenseTotal: sums.EXPENSE ?? 0,
      inboundRefundTotal: sums.REFUND_INBOUND ?? 0,
      outboundRefundTotal: sums.REFUND_OUTBOUND ?? 0,
      count,
    };
  }

  private async requireOriginal(tx: Tx, actor: ActorContext, id: string, paymentType: PaymentType): Promise<PaymentRecord> {
    const payment = await tx.payment.findFirst({
      where: { id, orgId: actor.orgId, paymentType, isDeleted: false, deletedAt: null },
      include: paymentInclude,
    });
    if (!payment) throw new Error("Original payment not found.");
    return payment;
  }
}

function paymentWhere(actor: ActorContext, filters: PaymentFilterInput): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = { orgId: actor.orgId, isDeleted: false, deletedAt: null };
  if (filters.type) where.paymentType = filters.type as PaymentType;
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { receiptNo: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { booking: { packageName: { contains: q, mode: "insensitive" } } },
      { booking: { pnrNo: { contains: q, mode: "insensitive" } } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { vendor: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

function activePaymentWhere(actor: ActorContext, id: string): Prisma.PaymentWhereInput {
  return { id, orgId: actor.orgId, isDeleted: false, deletedAt: null };
}

async function assertCustomerAccount(tx: Tx, orgId: string, customerId: string, accountId: string) {
  const count = await tx.customer.count({ where: { id: customerId, orgId, accountId, isDeleted: false, deletedAt: null } });
  if (count === 0) throw new Error("Selected account is not linked to this booking customer.");
}

async function assertActiveAccount(tx: Tx, orgId: string, accountId: string) {
  const count = await tx.account.count({ where: { id: accountId, orgId, isActive: true, deletedAt: null, archivedAt: null } });
  if (count === 0) throw new Error("Account not found.");
}

function refundAmount(original: PaymentRecord, requested: number | undefined, refundType: PaymentType) {
  const refunded = original.refunds
    .filter((refund) => refund.paymentType === refundType && !refund.isDeleted && !refund.deletedAt)
    .reduce((total, refund) => total + Number(refund.amount), 0);
  const remaining = Number(original.amount) - refunded;
  const amount = requested ?? remaining;
  if (remaining <= 0) throw new Error("Original payment has already been fully refunded.");
  if (amount > remaining) throw new Error("Refund amount cannot exceed the remaining refundable amount.");
  return amount;
}

function toPaymentMode(mode: string): PaymentMode {
  if (mode in PaymentMode) return mode as PaymentMode;
  throw new Error("Unsupported payment mode.");
}

function valueOrUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clampLimit(limit = 10) {
  return Math.min(Math.max(limit, 1), 100);
}

function paymentLabel(payment: PaymentRecord) {
  if (!payment.booking) return "";
  return payment.booking.packageName || payment.booking.pnrNo || payment.booking.primaryPaxName || payment.booking.id;
}

function refundableAmount(payment: PaymentRecord) {
  if (payment.paymentType !== PaymentType.RECEIVABLE && payment.paymentType !== PaymentType.EXPENSE) return 0;
  const refundType = payment.paymentType === PaymentType.RECEIVABLE ? PaymentType.REFUND_OUTBOUND : PaymentType.REFUND_INBOUND;
  const refunded = payment.refunds
    .filter((refund) => refund.paymentType === refundType && !refund.isDeleted && !refund.deletedAt)
    .reduce((total, refund) => total + Number(refund.amount), 0);
  return Math.max(0, Number(payment.amount) - refunded);
}

export function toPaymentDto(payment: PaymentRecord): PaymentDto {
  return {
    id: payment.id,
    orgId: payment.orgId,
    paymentType: payment.paymentType as PaymentTypeLabel,
    amount: Number(payment.amount),
    currency: payment.currency,
    paymentMode: payment.paymentMode,
    bookingId: payment.bookingId ?? "",
    bookingLabel: paymentLabel(payment),
    customerId: payment.customerId ?? "",
    customerName: payment.customer?.name ?? payment.booking?.customer.name ?? "",
    vendorId: payment.vendorId ?? "",
    vendorName: payment.vendor?.name ?? payment.booking?.vendor?.name ?? "",
    refundOfPaymentId: payment.refundOfPaymentId ?? "",
    category: payment.category ?? "",
    notes: payment.notes ?? "",
    receiptNo: payment.receiptNo ?? "",
    fromAccountId: payment.fromAccountId ?? "",
    fromAccount: payment.fromAccount ? toAccountDto(payment.fromAccount) : null,
    toAccountId: payment.toAccountId ?? "",
    toAccount: payment.toAccount ? toAccountDto(payment.toAccount) : null,
    refundableAmount: refundableAmount(payment),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}
