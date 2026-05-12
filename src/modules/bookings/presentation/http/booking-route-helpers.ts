import "server-only";
import type { NextRequest } from "next/server";
import { bookingStatuses, type BookingFilterInput, type BookingStatusLabel } from "../../application/booking-dto";

export function filtersFromRequest(request: NextRequest): BookingFilterInput {
  const { searchParams } = new URL(request.url);
  const dueRange = parseRange(searchParams.get("dueAmount"));
  const bookingDate = parseRange(searchParams.get("bookingDate"));
  const travelStart = parseRange(searchParams.get("travelStartAt"));
  const travelEnd = parseRange(searchParams.get("travelEndAt"));
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");

  return {
    q: searchParams.get("q") ?? undefined,
    status: isBookingStatus(status) ? status : undefined,
    paymentStatus: paymentStatus === "paid" || paymentStatus === "partial" || paymentStatus === "unpaid" ? paymentStatus : undefined,
    dueAmountMin: dueRange[0] ? Number(dueRange[0]) : undefined,
    dueAmountMax: dueRange[1] ? Number(dueRange[1]) : undefined,
    bookingDateFrom: bookingDate[0],
    bookingDateTo: bookingDate[1],
    travelStartFrom: travelStart[0],
    travelStartTo: travelStart[1],
    travelEndFrom: travelEnd[0],
    travelEndTo: travelEnd[1],
    limit: Number(searchParams.get("limit") ?? 10),
    offset: Number(searchParams.get("offset") ?? 0),
  };
}

function parseRange(value: string | null): [string | undefined, string | undefined] {
  if (!value) return [undefined, undefined];
  const [from, to] = value.split(",");
  return [from?.trim() || undefined, to?.trim() || undefined];
}

function isBookingStatus(value: string | null): value is BookingStatusLabel {
  return Boolean(value && bookingStatuses.includes(value as BookingStatusLabel));
}
