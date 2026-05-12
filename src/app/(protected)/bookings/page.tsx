import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { BookingsPageClient } from "@/modules/bookings/presentation/components/BookingsPageClient";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";

export default async function BookingsPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    return null;
  }

  const [initial, customers, vendors] = await Promise.all([
    new PrismaBookingRepository().list(actor, { limit: 100, offset: 0 }),
    new PrismaCustomerRepository().list(actor, { limit: 100, offset: 0 }),
    new PrismaVendorRepository().list(actor, { limit: 100, offset: 0 }),
  ]);

  return <BookingsPageClient customers={customers.data} initial={initial} vendors={vendors.data} />;
}
