import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor("payments.read.any");
    const { id } = await params;
    const data = await new PrismaPaymentRepository().findById(actor, id);
    if (!data) throw new RouteError("Payment not found.", 404);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
