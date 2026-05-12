import type { NextRequest } from "next/server";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { bookingStatusInputSchema } from "@/modules/bookings/presentation/schemas/booking-schemas";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor("bookings.status.update.any");
    const { status, adminOverride } = bookingStatusInputSchema.parse(await request.json());
    const data = await new PrismaBookingRepository().setStatus(actor, id, status, adminOverride);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
