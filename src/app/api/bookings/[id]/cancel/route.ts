import type { NextRequest } from "next/server";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor("bookings.status.update.any");
    const data = await new PrismaBookingRepository().setStatus(actor, id, "Cancelled");
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
