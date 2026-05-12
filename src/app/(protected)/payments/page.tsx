import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { FinancePageClient } from "@/modules/payments/presentation/components/FinancePageClient";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";

export default async function PaymentsPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    return null;
  }

  const [initial, bookings] = await Promise.all([
    new PrismaPaymentRepository().list(actor, { type: "RECEIVABLE", limit: 100, offset: 0 }),
    new PrismaBookingRepository().list(actor, { limit: 100, offset: 0 }),
  ]);

  return <FinancePageClient accounts={[]} bookings={bookings.data} initial={initial} mode="payments" vendors={[]} />;
}
