import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { FinancePageClient } from "@/modules/payments/presentation/components/FinancePageClient";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";

export default async function RefundsPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    return null;
  }

  const repository = new PrismaPaymentRepository();
  const [outbound, inbound, receivables, expenses] = await Promise.all([
    repository.list(actor, { type: "REFUND_OUTBOUND", limit: 100, offset: 0 }),
    repository.list(actor, { type: "REFUND_INBOUND", limit: 100, offset: 0 }),
    repository.list(actor, { type: "RECEIVABLE", limit: 100, offset: 0 }),
    repository.list(actor, { type: "EXPENSE", limit: 100, offset: 0 }),
  ]);

  return (
    <FinancePageClient
      accounts={[]}
      bookings={[]}
      expenses={expenses.data}
      initial={{ ...outbound, data: [...outbound.data, ...inbound.data], count: outbound.count + inbound.count }}
      mode="refunds"
      receivables={receivables.data}
      vendors={[]}
    />
  );
}
