"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { AuthorizationService } from "@/modules/authorization/application/authorization-service";
import type { PermissionCode } from "@/modules/authorization/domain/permissions";
import { PrismaPaymentRepository } from "../../infrastructure/prisma-payment-repository";
import { expensePaymentSchema, receivablePaymentSchema, refundPaymentSchema } from "../schemas/payment-schemas";

export type PaymentActionResult<T = unknown> =
  | { ok: true; data?: T; message: string }
  | { ok: false; message: string };

export async function createReceivablePaymentAction(input: unknown): Promise<PaymentActionResult> {
  try {
    const actor = await requireActor("payments.receivable.create.any");
    const payment = await new PrismaPaymentRepository().createReceivable(actor, receivablePaymentSchema.parse(input));
    revalidateFinance();
    return { ok: true, data: payment, message: "Receivable payment recorded." };
  } catch (error) {
    return actionError(error, "Receivable payment failed.");
  }
}

export async function createExpensePaymentAction(input: unknown): Promise<PaymentActionResult> {
  try {
    const actor = await requireActor("payments.expense.create.any");
    const payment = await new PrismaPaymentRepository().createExpense(actor, expensePaymentSchema.parse(input));
    revalidateFinance();
    return { ok: true, data: payment, message: "Expense recorded." };
  } catch (error) {
    return actionError(error, "Expense payment failed.");
  }
}

export async function createOutboundRefundAction(input: unknown): Promise<PaymentActionResult> {
  try {
    const actor = await requireActor("payments.refund.create.any");
    const payment = await new PrismaPaymentRepository().createOutboundRefund(actor, refundPaymentSchema.parse(input));
    revalidateFinance();
    return { ok: true, data: payment, message: "Customer refund processed." };
  } catch (error) {
    return actionError(error, "Customer refund failed.");
  }
}

export async function createInboundRefundAction(input: unknown): Promise<PaymentActionResult> {
  try {
    const actor = await requireActor("payments.refund.create.any");
    const payment = await new PrismaPaymentRepository().createInboundRefund(actor, refundPaymentSchema.parse(input));
    revalidateFinance();
    return { ok: true, data: payment, message: "Vendor refund processed." };
  } catch (error) {
    return actionError(error, "Vendor refund failed.");
  }
}

async function requireActor(permission: PermissionCode) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error("Unauthorized.");
  new AuthorizationService().assertCan(actor, permission);
  return actor;
}

function revalidateFinance() {
  revalidatePath("/payments");
  revalidatePath("/expenses");
  revalidatePath("/refunds");
  revalidatePath("/bookings");
  revalidatePath("/customers");
  revalidatePath("/vendors");
  revalidatePath("/reports");
  revalidatePath("/customers/report");
  revalidatePath("/vendors/report");
}

function actionError(error: unknown, fallback: string): PaymentActionResult {
  return { ok: false, message: error instanceof Error ? error.message : fallback };
}
