import type { NextRequest } from "next/server";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { filtersFromRequest } from "@/modules/bookings/presentation/http/booking-route-helpers";
import { bookingInputSchema } from "@/modules/bookings/presentation/schemas/booking-schemas";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("bookings.read.any");
    const data = await new PrismaBookingRepository().list(actor, filtersFromRequest(request));
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActor("bookings.create.any");
    const input = bookingInputSchema.parse(await request.json());
    const data = await new PrismaBookingRepository().create(actor, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
