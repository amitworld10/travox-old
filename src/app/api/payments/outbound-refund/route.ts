import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { refundPaymentSchema } from "@/modules/payments/presentation/schemas/payment-schemas";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function POST(request: Request) {
  try {
    const actor = await requireActor("payments.refund.create.any");
    const input = refundPaymentSchema.parse(await request.json());
    const data = await new PrismaPaymentRepository().createOutboundRefund(actor, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
