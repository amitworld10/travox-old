import type { CustomerDto } from "@/modules/customers/application/customer-dto";
import type { VendorDto } from "@/modules/vendors/application/vendor-dto";

export const bookingStatuses = ["Draft", "Confirmed", "Ticketed", "In Progress", "Completed", "Cancelled", "Refunded"] as const;
export const paxTypes = ["ADT", "CHD", "INF"] as const;
export const sexes = ["MALE", "FEMALE", "TRANSGENDER"] as const;
export const journeyModes = ["FLIGHT", "TRAIN", "BUS", "HOTEL", "CAB", "OTHER"] as const;

export type BookingStatusLabel = (typeof bookingStatuses)[number];
export type PaxTypeLabel = (typeof paxTypes)[number];
export type SexLabel = (typeof sexes)[number];
export type JourneyModeLabel = (typeof journeyModes)[number];

export type BookingPaxDto = {
  id: string;
  paxName: string;
  paxType: PaxTypeLabel;
  sex?: SexLabel | "";
  passportNo: string;
  dob: string;
};

export type BookingSegmentDto = {
  id: string;
  seqNo: number;
  modeOfJourney: JourneyModeLabel;
  carrierCode: string;
  serviceNumber: string;
  depCode: string;
  arrCode: string;
  depAt: string;
  arrAt: string;
  classCode: string;
  baggage: string;
  hotelName: string;
  hotelAddress: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  mealPlan: string;
  operatorName: string;
  boardingPoint: string;
  dropPoint: string;
};

export type BookingItineraryDto = {
  id: string;
  name: string;
  seqNo: number;
  segments: BookingSegmentDto[];
};

export type BookingDto = {
  id: string;
  orgId: string;
  customerId: string;
  customerName: string;
  customer: CustomerDto | null;
  vendorId: string;
  vendorName: string;
  vendor: VendorDto | null;
  bookingDate: string;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  dueAmount: number;
  paxCount: number;
  primaryPaxName: string;
  travelStartAt: string;
  travelEndAt: string;
  packageName: string;
  pnrNo: string;
  modeOfJourney: string;
  advanceAmount: number;
  status: BookingStatusLabel;
  pax: BookingPaxDto[];
  itineraries: BookingItineraryDto[];
  createdAt: string;
  updatedAt: string;
};

export type BookingInput = {
  customerId: string;
  vendorId?: string;
  bookingDate: string;
  currency: string;
  totalAmount: number;
  paidAmount?: number;
  packageName?: string;
  pnrNo?: string;
  modeOfJourney?: string;
  advanceAmount?: number;
  status?: BookingStatusLabel;
  pax: Array<{
    paxName: string;
    paxType: PaxTypeLabel;
    sex?: SexLabel | "";
    passportNo?: string;
    dob?: string;
  }>;
  itineraries: Array<{
    name: string;
    seqNo: number;
    segments: Array<{
      seqNo: number;
      modeOfJourney: JourneyModeLabel;
      carrierCode?: string;
      serviceNumber?: string;
      depCode?: string;
      arrCode?: string;
      depAt?: string;
      arrAt?: string;
      classCode?: string;
      baggage?: string;
      hotelName?: string;
      hotelAddress?: string;
      checkIn?: string;
      checkOut?: string;
      roomType?: string;
      mealPlan?: string;
      operatorName?: string;
      boardingPoint?: string;
      dropPoint?: string;
    }>;
  }>;
};

export type BookingListDto = {
  data: BookingDto[];
  count: number;
  stats: BookingStatsDto;
};

export type BookingStatsDto = {
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  revenueForecast: number;
  pendingAmount: number;
};

export type BookingFilterInput = {
  q?: string;
  status?: BookingStatusLabel;
  paymentStatus?: "paid" | "partial" | "unpaid";
  dueAmountMin?: number;
  dueAmountMax?: number;
  bookingDateFrom?: string;
  bookingDateTo?: string;
  travelStartFrom?: string;
  travelStartTo?: string;
  travelEndFrom?: string;
  travelEndTo?: string;
  limit?: number;
  offset?: number;
};
