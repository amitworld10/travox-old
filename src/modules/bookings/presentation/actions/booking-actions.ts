"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { AuthorizationService } from "@/modules/authorization/application/authorization-service";
import type { PermissionCode } from "@/modules/authorization/domain/permissions";
import { PrismaBookingRepository } from "../../infrastructure/prisma-booking-repository";
import { bookingInputSchema, bookingStatusInputSchema } from "../schemas/booking-schemas";

export type BookingActionResult<T = unknown> =
  | { ok: true; data?: T; message: string }
  | { ok: false; message: string };

export async function saveBookingAction(input: unknown, id?: string): Promise<BookingActionResult> {
  try {
    const actor = await requireActor(id ? "bookings.update.any" : "bookings.create.any");
    const data = bookingInputSchema.parse(input);
    const repo = new PrismaBookingRepository();
    const booking = id ? await repo.update(actor, id, data) : await repo.create(actor, data);
    revalidateBookings();
    return { ok: true, data: booking, message: id ? "Booking updated." : "Booking created." };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteBookingAction(id: string): Promise<BookingActionResult> {
  try {
    const actor = await requireActor("bookings.delete.any");
    await new PrismaBookingRepository().softDelete(actor, id);
    revalidateBookings();
    return { ok: true, message: "Booking deleted." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateBookingStatusAction(id: string, input: unknown): Promise<BookingActionResult> {
  try {
    const actor = await requireActor("bookings.status.update.any");
    const { status, adminOverride } = bookingStatusInputSchema.parse(input);
    const booking = await new PrismaBookingRepository().setStatus(actor, id, status, adminOverride);
    revalidateBookings();
    return { ok: true, data: booking, message: `Booking marked ${status}.` };
  } catch (error) {
    return actionError(error);
  }
}

async function requireActor(permission: PermissionCode) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error("Unauthorized.");
  new AuthorizationService().assertCan(actor, permission);
  return actor;
}

function revalidateBookings() {
  revalidatePath("/bookings");
  revalidatePath("/customers");
  revalidatePath("/vendors");
  revalidatePath("/customers/report");
  revalidatePath("/vendors/report");
}

function actionError(error: unknown): BookingActionResult {
  return { ok: false, message: error instanceof Error ? error.message : "Booking action failed." };
}
