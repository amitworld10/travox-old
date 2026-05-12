import type { NextRequest } from "next/server";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { filtersFromRequest } from "@/modules/bookings/presentation/http/booking-route-helpers";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("bookings.read.any");
    const data = await new PrismaBookingRepository().list(actor, { ...filtersFromRequest(request), limit: 50 });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
