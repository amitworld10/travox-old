import type { NextRequest } from "next/server";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("bookings.read.any");
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (!startDate || !endDate) throw new RouteError("startDate and endDate are required.", 400);
    const data = await new PrismaBookingRepository().byTravelDates(actor, startDate, endDate);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
