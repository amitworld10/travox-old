import { z } from "zod";
import { bookingStatuses, journeyModes, paxTypes, sexes } from "../../application/booking-dto";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const optionalDate = optionalText;

export const bookingPaxInputSchema = z.object({
  paxName: z.string().trim().min(1, "PAX name is required."),
  paxType: z.enum(paxTypes),
  sex: z.enum(sexes).or(z.literal("")).optional().transform((value) => value || undefined),
  passportNo: optionalText,
  dob: optionalDate,
});

export const bookingSegmentInputSchema = z.object({
  seqNo: z.coerce.number().int().positive(),
  modeOfJourney: z.enum(journeyModes),
  carrierCode: optionalText,
  serviceNumber: optionalText,
  depCode: optionalText.transform((value) => value?.toUpperCase()),
  arrCode: optionalText.transform((value) => value?.toUpperCase()),
  depAt: optionalDate,
  arrAt: optionalDate,
  classCode: optionalText,
  baggage: optionalText,
  hotelName: optionalText,
  hotelAddress: optionalText,
  checkIn: optionalDate,
  checkOut: optionalDate,
  roomType: optionalText,
  mealPlan: optionalText,
  operatorName: optionalText,
  boardingPoint: optionalText,
  dropPoint: optionalText,
});

export const bookingItineraryInputSchema = z.object({
  name: z.string().trim().min(1, "Itinerary name is required."),
  seqNo: z.coerce.number().int().positive(),
  segments: z.array(bookingSegmentInputSchema),
});

export const bookingInputSchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required."),
  vendorId: optionalText,
  bookingDate: z.string().trim().min(1, "Booking date is required."),
  currency: z.string().trim().min(1).default("INR"),
  totalAmount: z.coerce.number().positive("Total amount must be greater than zero."),
  paidAmount: z.coerce.number().min(0).optional(),
  packageName: optionalText,
  pnrNo: optionalText,
  modeOfJourney: optionalText,
  advanceAmount: z.coerce.number().min(0).optional(),
  status: z.enum(bookingStatuses).optional(),
  pax: z.array(bookingPaxInputSchema).min(1),
  itineraries: z.array(bookingItineraryInputSchema).default([]),
});

export const bookingStatusInputSchema = z.object({
  status: z.enum(bookingStatuses),
  adminOverride: z.boolean().optional(),
});

export type BookingInputPayload = z.infer<typeof bookingInputSchema>;
