import { PrismaAccountRepository } from "@/modules/accounts/infrastructure/prisma-account-repository";
import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { FinancePageClient } from "@/modules/payments/presentation/components/FinancePageClient";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";

export default async function ExpensesPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    return null;
  }

  const [initial, vendors, accounts] = await Promise.all([
    new PrismaPaymentRepository().list(actor, { type: "EXPENSE", limit: 100, offset: 0 }),
    new PrismaVendorRepository().list(actor, { limit: 100, offset: 0 }),
    new PrismaAccountRepository().list(actor),
  ]);

  return <FinancePageClient accounts={accounts} bookings={[]} initial={initial} mode="expenses" vendors={vendors.data} />;
}
