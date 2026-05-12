import type { BookingInput, BookingItineraryDto, BookingSegmentDto, JourneyModeLabel } from "../application/booking-dto";

export function validateBookingInput(input: BookingInput) {
  if (!input.customerId) {
    throw new Error("Customer is required.");
  }
  if (!input.currency) {
    throw new Error("Currency is required.");
  }
  if (input.totalAmount <= 0) {
    throw new Error("Total amount must be greater than zero.");
  }
  if ((input.paidAmount ?? 0) > input.totalAmount) {
    throw new Error("Paid amount cannot exceed total amount.");
  }
  if (input.pax.length < 1) {
    throw new Error("At least one PAX is required.");
  }

  for (const pax of input.pax) {
    if (!pax.paxName.trim()) {
      throw new Error("PAX name is required.");
    }
    if (!pax.paxType) {
      throw new Error("PAX type is required.");
    }
  }

  for (const itinerary of input.itineraries) {
    for (const segment of itinerary.segments) {
      validateSegment(segment);
    }
  }
}

export function validateSegment(segment: {
  modeOfJourney: BookingSegmentDto["modeOfJourney"];
  depCode?: string;
  boardingPoint?: string;
  hotelName?: string;
}) {
  switch (segment.modeOfJourney as JourneyModeLabel) {
    case "FLIGHT":
      if (!segment.depCode) throw new Error("Departure code is required for flight segments.");
      break;
    case "HOTEL":
      if (!segment.hotelName) throw new Error("Hotel name is required for hotel segments.");
      break;
    case "TRAIN":
    case "BUS":
      if (!segment.depCode && !segment.boardingPoint) {
        throw new Error("Departure code or boarding point is required for train and bus segments.");
      }
      break;
  }
}

export function deriveBookingFields(input: Pick<BookingInput, "pax" | "itineraries" | "totalAmount" | "paidAmount">) {
  const starts: Date[] = [];
  const ends: Date[] = [];

  for (const segment of input.itineraries.flatMap((itinerary) => itinerary.segments)) {
    const start = segment.modeOfJourney === "HOTEL" ? segment.checkIn : segment.depAt;
    const end = segment.modeOfJourney === "HOTEL" ? segment.checkOut : segment.arrAt;
    const startDate = parseMaybeDate(start);
    const endDate = parseMaybeDate(end);
    if (startDate) starts.push(startDate);
    if (endDate) ends.push(endDate);
  }

  const paidAmount = input.paidAmount ?? 0;

  return {
    dueAmount: Math.max(0, input.totalAmount - paidAmount),
    paidAmount,
    paxCount: input.pax.length,
    primaryPaxName: input.pax[0]?.paxName ?? undefined,
    travelStartAt: starts.length > 0 ? new Date(Math.min(...starts.map((date) => date.getTime()))) : undefined,
    travelEndAt: ends.length > 0 ? new Date(Math.max(...ends.map((date) => date.getTime()))) : undefined,
  };
}

export function hasSegments(itineraries: BookingItineraryDto[]) {
  return itineraries.some((itinerary) => itinerary.segments.length > 0);
}

function parseMaybeDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
