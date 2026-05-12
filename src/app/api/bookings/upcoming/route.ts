import type { NextRequest } from "next/server";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("bookings.read.any");
    const { searchParams } = new URL(request.url);
    const data = await new PrismaBookingRepository().upcoming(actor, Number(searchParams.get("days") ?? 30));
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
