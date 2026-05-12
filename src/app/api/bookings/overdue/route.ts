import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET() {
  try {
    const actor = await requireActor("bookings.read.any");
    const data = await new PrismaBookingRepository().overdue(actor);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
