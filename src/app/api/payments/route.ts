import type { NextRequest } from "next/server";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { paymentFiltersFromRequest } from "@/modules/payments/presentation/http/payment-route-helpers";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("payments.read.any");
    const data = await new PrismaPaymentRepository().list(actor, paymentFiltersFromRequest(request));
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
