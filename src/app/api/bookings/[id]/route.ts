import type { NextRequest } from "next/server";
import { PrismaBookingRepository } from "@/modules/bookings/infrastructure/prisma-booking-repository";
import { bookingInputSchema } from "@/modules/bookings/presentation/schemas/booking-schemas";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("bookings.read.any");
    const data = await new PrismaBookingRepository().findById(actor, id);
    if (!data) throw new RouteError("Booking not found.", 404);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("bookings.update.any");
    const input = bookingInputSchema.parse(await request.json());
    const data = await new PrismaBookingRepository().update(actor, id, input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("bookings.delete.any");
    await new PrismaBookingRepository().softDelete(actor, id);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}
