import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { MasterDataPageClient } from "@/modules/master-data/presentation/components/MasterDataPageClient";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";

export default async function VendorsPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    return null;
  }

  const initial = await new PrismaVendorRepository().list(actor, { limit: 100, offset: 0 });

  return <MasterDataPageClient initial={initial} mode="vendors" />;
}
