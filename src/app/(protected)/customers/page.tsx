import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { MasterDataPageClient } from "@/modules/master-data/presentation/components/MasterDataPageClient";

export default async function CustomersPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    return null;
  }

  const initial = await new PrismaCustomerRepository().list(actor, { limit: 100, offset: 0 });

  return <MasterDataPageClient initial={initial} mode="customers" />;
}
