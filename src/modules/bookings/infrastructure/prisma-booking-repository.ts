import "server-only";
import { BookingStatus, ModeOfJourney, PaxType, Sex, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import { recordAuditEvent } from "@/modules/audit-logs/application/record-audit-event";
import { toCustomerDto } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { toVendorDto } from "@/modules/vendors/infrastructure/prisma-vendor-repository";
import type {
  BookingDto,
  BookingFilterInput,
  BookingInput,
  BookingListDto,
  BookingStatsDto,
  BookingStatusLabel,
} from "../application/booking-dto";
import { deriveBookingFields, hasSegments, validateBookingInput } from "../domain/booking-rules";

const bookingInclude = {
  customer: { include: { account: true } },
  vendor: { include: { account: true } },
  pax: { orderBy: { createdAt: "asc" } },
  itineraries: {
    orderBy: { seqNo: "asc" },
    include: { segments: { orderBy: { seqNo: "asc" } } },
  },
} as const;

type BookingRecord = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;
type Tx = Prisma.TransactionClient;

export class PrismaBookingRepository {
  async list(actor: ActorContext, filters: BookingFilterInput = {}): Promise<BookingListDto> {
    const where = bookingWhere(actor, filters);
    const take = clampLimit(filters.limit);
    const skip = Math.max(0, filters.offset ?? 0);
    const [bookings, count, stats] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.booking.count({ where }),
      this.stats(actor),
    ]);

    return { data: bookings.map(toBookingDto), count, stats };
  }

  async findById(actor: ActorContext, id: string): Promise<BookingDto | null> {
    const booking = await prisma.booking.findFirst({
      where: activeBookingWhere(actor, id),
      include: bookingInclude,
    });

    return booking ? toBookingDto(booking) : null;
  }

  async create(actor: ActorContext, input: BookingInput): Promise<BookingDto> {
    validateBookingInput(input);
    await this.assertCustomer(actor, input.customerId);
    if (input.vendorId) await this.assertVendor(actor, input.vendorId);

    const booking = await prisma.$transaction(async (tx) => {
      const derived = deriveBookingFields(input);
      const booking = await tx.booking.create({
        data: {
          orgId: actor.orgId,
          customerId: input.customerId,
          vendorId: input.vendorId,
          bookingDate: toDate(input.bookingDate),
          currency: input.currency,
          totalAmount: input.totalAmount,
          paidAmount: derived.paidAmount,
          dueAmount: derived.dueAmount,
          paxCount: derived.paxCount,
          primaryPaxName: derived.primaryPaxName,
          travelStartAt: derived.travelStartAt,
          travelEndAt: derived.travelEndAt,
          packageName: input.packageName,
          pnrNo: input.pnrNo,
          modeOfJourney: input.modeOfJourney,
          advanceAmount: input.advanceAmount,
          status: toBookingStatus(input.status ?? "Draft"),
          createdBy: actor.userId,
          updatedBy: actor.userId,
          pax: { create: input.pax.map((pax) => paxCreate(actor, pax)) },
          itineraries: {
            create: input.itineraries.map((itinerary) => ({
              orgId: actor.orgId,
              name: itinerary.name,
              seqNo: itinerary.seqNo,
              segments: { create: itinerary.segments.map((segment) => segmentCreate(actor, segment)) },
            })),
          },
        },
        include: bookingInclude,
      });

      await refreshCounters(tx, actor.orgId, [input.customerId], input.vendorId ? [input.vendorId] : []);
      return toBookingDto(booking);
    });
    await recordAuditEvent({ actor, entity: "bookings", entityId: booking.id, action: "CREATE", after: booking });
    return booking;
  }

  async update(actor: ActorContext, id: string, input: BookingInput): Promise<BookingDto> {
    validateBookingInput(input);
    await this.assertCustomer(actor, input.customerId);
    if (input.vendorId) await this.assertVendor(actor, input.vendorId);
    const existing = await this.requireRaw(actor, id);
    const before = toBookingDto(existing);

    const booking = await prisma.$transaction(async (tx) => {
      const derived = deriveBookingFields(input);
      await tx.bookingSegment.deleteMany({ where: { itinerary: { bookingId: id, orgId: actor.orgId } } });
      await tx.bookingItinerary.deleteMany({ where: { bookingId: id, orgId: actor.orgId } });
      await tx.bookingPax.deleteMany({ where: { bookingId: id, orgId: actor.orgId } });

      const booking = await tx.booking.update({
        where: { id },
        data: {
          customerId: input.customerId,
          vendorId: input.vendorId,
          bookingDate: toDate(input.bookingDate),
          currency: input.currency,
          totalAmount: input.totalAmount,
          paidAmount: derived.paidAmount,
          dueAmount: derived.dueAmount,
          paxCount: derived.paxCount,
          primaryPaxName: derived.primaryPaxName,
          travelStartAt: derived.travelStartAt,
          travelEndAt: derived.travelEndAt,
          packageName: input.packageName,
          pnrNo: input.pnrNo,
          modeOfJourney: input.modeOfJourney,
          advanceAmount: input.advanceAmount,
          status: input.status ? toBookingStatus(input.status) : undefined,
          updatedBy: actor.userId,
          pax: { create: input.pax.map((pax) => paxCreate(actor, pax)) },
          itineraries: {
            create: input.itineraries.map((itinerary) => ({
              orgId: actor.orgId,
              name: itinerary.name,
              seqNo: itinerary.seqNo,
              segments: { create: itinerary.segments.map((segment) => segmentCreate(actor, segment)) },
            })),
          },
        },
        include: bookingInclude,
      });

      await refreshCounters(
        tx,
        actor.orgId,
        uniqueIds([existing.customerId, input.customerId]),
        uniqueIds([existing.vendorId, input.vendorId].filter(Boolean) as string[]),
      );
      return toBookingDto(booking);
    });
    await recordAuditEvent({ actor, entity: "bookings", entityId: id, action: "UPDATE", before, after: booking });
    return booking;
  }

  async softDelete(actor: ActorContext, id: string): Promise<void> {
    const existing = await this.requireRaw(actor, id);
    const before = toBookingDto(existing);
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          archivedAt: new Date(),
          updatedBy: actor.userId,
        },
      });
      await refreshCounters(tx, actor.orgId, [existing.customerId], existing.vendorId ? [existing.vendorId] : []);
    });
    await recordAuditEvent({ actor, entity: "bookings", entityId: id, action: "DELETE", before });
  }

  async setStatus(actor: ActorContext, id: string, status: BookingStatusLabel, adminOverride = false): Promise<BookingDto> {
    const current = await this.requireRaw(actor, id);
    if (status === "Confirmed" && current.pax.length < 1) {
      throw new Error("Cannot confirm booking: at least one PAX is required.");
    }
    if (status === "Ticketed" && !hasSegments(toBookingDto(current).itineraries)) {
      throw new Error("Cannot ticket booking: at least one travel segment is required.");
    }
    if (status === "Completed" && !adminOverride) {
      if (current.travelEndAt && current.travelEndAt >= new Date()) {
        throw new Error("Cannot complete booking: travel has not ended yet.");
      }
      if (Number(current.dueAmount) > 0) {
        throw new Error("Cannot complete booking: outstanding due amount must be 0.");
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: toBookingStatus(status),
        dueAmount: status === "Refunded" ? 0 : undefined,
        updatedBy: actor.userId,
      },
      include: bookingInclude,
    });

    const dto = toBookingDto(booking);
    await recordAuditEvent({ actor, entity: "bookings", entityId: id, action: "STATUS_CHANGE", before: { status: fromBookingStatus(current.status) }, after: { status: dto.status } });
    return dto;
  }

  async upcoming(actor: ActorContext, days = 30) {
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + days);
    return this.list(actor, { travelStartFrom: now.toISOString(), travelStartTo: until.toISOString(), limit: 100 });
  }

  async overdue(actor: ActorContext) {
    return this.list(actor, { dueAmountMin: 0.01, travelEndTo: new Date().toISOString(), limit: 100 });
  }

  async byTravelDates(actor: ActorContext, startDate: string, endDate: string) {
    return this.list(actor, { travelStartFrom: startDate, travelEndTo: endDate, limit: 100 });
  }

  async stats(actor: ActorContext, range?: { startDate?: string; endDate?: string }): Promise<BookingStatsDto> {
    const where: Prisma.BookingWhereInput = {
      orgId: actor.orgId,
      isDeleted: false,
      deletedAt: null,
      ...(range?.startDate || range?.endDate
        ? { bookingDate: { gte: range.startDate ? toDate(range.startDate) : undefined, lte: range.endDate ? toDate(range.endDate) : undefined } }
        : {}),
    };

    const [totalBookings, confirmedBookings, sums] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: { in: [BookingStatus.CONFIRMED, BookingStatus.TICKETED, BookingStatus.COMPLETED] } } }),
      prisma.booking.aggregate({ where, _sum: { totalAmount: true, dueAmount: true, paidAmount: true } }),
    ]);

    return {
      totalBookings,
      confirmedBookings,
      totalRevenue: Number(sums._sum.paidAmount ?? 0),
      revenueForecast: Number(sums._sum.totalAmount ?? 0),
      pendingAmount: Number(sums._sum.dueAmount ?? 0),
    };
  }

  private async requireRaw(actor: ActorContext, id: string): Promise<BookingRecord> {
    const booking = await prisma.booking.findFirst({
      where: activeBookingWhere(actor, id),
      include: bookingInclude,
    });

    if (!booking) {
      throw new Error("Booking not found.");
    }

    return booking;
  }

  private async assertCustomer(actor: ActorContext, customerId: string) {
    const count = await prisma.customer.count({ where: { id: customerId, orgId: actor.orgId, isDeleted: false, deletedAt: null } });
    if (count === 0) throw new Error("Customer not found.");
  }

  private async assertVendor(actor: ActorContext, vendorId: string) {
    const count = await prisma.vendor.count({ where: { id: vendorId, orgId: actor.orgId, isDeleted: false, deletedAt: null } });
    if (count === 0) throw new Error("Vendor not found.");
  }
}

function bookingWhere(actor: ActorContext, filters: BookingFilterInput): Prisma.BookingWhereInput {
  const where: Prisma.BookingWhereInput = { orgId: actor.orgId, isDeleted: false, deletedAt: null };
  const and: Prisma.BookingWhereInput[] = [];

  if (filters.q) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { packageName: { contains: q, mode: "insensitive" } },
        { pnrNo: { contains: q, mode: "insensitive" } },
        { primaryPaxName: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (filters.status) where.status = toBookingStatus(filters.status);
  if (filters.paymentStatus === "paid") and.push({ dueAmount: { lte: 0 } });
  if (filters.paymentStatus === "partial") and.push({ paidAmount: { gt: 0 }, dueAmount: { gt: 0 } });
  if (filters.paymentStatus === "unpaid") and.push({ paidAmount: { lte: 0 } });
  if (filters.dueAmountMin !== undefined || filters.dueAmountMax !== undefined) {
    where.dueAmount = { gte: filters.dueAmountMin, lte: filters.dueAmountMax };
  }
  if (filters.bookingDateFrom || filters.bookingDateTo) {
    where.bookingDate = { gte: filters.bookingDateFrom ? toDate(filters.bookingDateFrom) : undefined, lte: filters.bookingDateTo ? toDate(filters.bookingDateTo) : undefined };
  }
  if (filters.travelStartFrom || filters.travelStartTo) {
    where.travelStartAt = { gte: filters.travelStartFrom ? toDate(filters.travelStartFrom) : undefined, lte: filters.travelStartTo ? toDate(filters.travelStartTo) : undefined };
  }
  if (filters.travelEndFrom || filters.travelEndTo) {
    where.travelEndAt = { gte: filters.travelEndFrom ? toDate(filters.travelEndFrom) : undefined, lte: filters.travelEndTo ? toDate(filters.travelEndTo) : undefined };
  }
  if (and.length > 0) where.AND = and;

  return where;
}

function activeBookingWhere(actor: ActorContext, id: string): Prisma.BookingWhereInput {
  return { id, orgId: actor.orgId, isDeleted: false, deletedAt: null };
}

function paxCreate(actor: ActorContext, pax: BookingInput["pax"][number]): Prisma.BookingPaxCreateWithoutBookingInput {
  return {
    orgId: actor.orgId,
    paxName: pax.paxName,
    paxType: pax.paxType as PaxType,
    sex: pax.sex ? (pax.sex as Sex) : undefined,
    passportNo: pax.passportNo,
    dob: pax.dob ? toDate(pax.dob) : undefined,
  };
}

function segmentCreate(actor: ActorContext, segment: BookingInput["itineraries"][number]["segments"][number]): Prisma.BookingSegmentCreateWithoutItineraryInput {
  return {
    orgId: actor.orgId,
    seqNo: segment.seqNo,
    modeOfJourney: segment.modeOfJourney as ModeOfJourney,
    carrierCode: segment.carrierCode,
    serviceNumber: segment.serviceNumber,
    depCode: segment.depCode,
    arrCode: segment.arrCode,
    depAt: segment.depAt ? toDate(segment.depAt) : undefined,
    arrAt: segment.arrAt ? toDate(segment.arrAt) : undefined,
    classCode: segment.classCode,
    baggage: segment.baggage,
    hotelName: segment.hotelName,
    hotelAddress: segment.hotelAddress,
    checkIn: segment.checkIn ? toDate(segment.checkIn) : undefined,
    checkOut: segment.checkOut ? toDate(segment.checkOut) : undefined,
    roomType: segment.roomType,
    mealPlan: segment.mealPlan,
    operatorName: segment.operatorName,
    boardingPoint: segment.boardingPoint,
    dropPoint: segment.dropPoint,
  };
}

async function refreshCounters(tx: Tx, orgId: string, customerIds: string[], vendorIds: string[]) {
  for (const customerId of uniqueIds(customerIds)) {
    const totalBookings = await tx.booking.count({ where: { orgId, customerId, isDeleted: false, deletedAt: null } });
    await tx.customer.update({ where: { id: customerId }, data: { totalBookings } });
  }
  for (const vendorId of uniqueIds(vendorIds)) {
    const totalBookings = await tx.booking.count({ where: { orgId, vendorId, isDeleted: false, deletedAt: null } });
    await tx.vendor.update({ where: { id: vendorId }, data: { totalBookings } });
  }
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

function clampLimit(limit = 10) {
  return Math.min(Math.max(limit, 1), 100);
}

function toDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date.");
  return date;
}

function toBookingStatus(status: BookingStatusLabel): BookingStatus {
  return status.toUpperCase().replace(/\s+/g, "_") as BookingStatus;
}

function fromBookingStatus(status: BookingStatus): BookingStatusLabel {
  const labels: Record<BookingStatus, BookingStatusLabel> = {
    DRAFT: "Draft",
    CONFIRMED: "Confirmed",
    TICKETED: "Ticketed",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
  };
  return labels[status];
}

function maybeIso(date?: Date | null) {
  return date ? date.toISOString() : "";
}

export function toBookingDto(booking: BookingRecord): BookingDto {
  return {
    id: booking.id,
    orgId: booking.orgId,
    customerId: booking.customerId,
    customerName: booking.customer.name,
    customer: toCustomerDto(booking.customer),
    vendorId: booking.vendorId ?? "",
    vendorName: booking.vendor?.name ?? "",
    vendor: booking.vendor ? toVendorDto(booking.vendor) : null,
    bookingDate: booking.bookingDate.toISOString(),
    currency: booking.currency,
    totalAmount: Number(booking.totalAmount),
    paidAmount: Number(booking.paidAmount),
    refundedAmount: Number(booking.refundedAmount),
    dueAmount: Number(booking.dueAmount),
    paxCount: booking.paxCount,
    primaryPaxName: booking.primaryPaxName ?? "",
    travelStartAt: maybeIso(booking.travelStartAt),
    travelEndAt: maybeIso(booking.travelEndAt),
    packageName: booking.packageName ?? "",
    pnrNo: booking.pnrNo ?? "",
    modeOfJourney: booking.modeOfJourney ?? "",
    advanceAmount: Number(booking.advanceAmount ?? 0),
    status: fromBookingStatus(booking.status),
    pax: booking.pax.map((pax) => ({
      id: pax.id,
      paxName: pax.paxName,
      paxType: pax.paxType,
      sex: pax.sex ?? "",
      passportNo: pax.passportNo ?? "",
      dob: maybeIso(pax.dob),
    })),
    itineraries: booking.itineraries.map((itinerary) => ({
      id: itinerary.id,
      name: itinerary.name,
      seqNo: itinerary.seqNo,
      segments: itinerary.segments.map((segment) => ({
        id: segment.id,
        seqNo: segment.seqNo,
        modeOfJourney: segment.modeOfJourney,
        carrierCode: segment.carrierCode ?? "",
        serviceNumber: segment.serviceNumber ?? "",
        depCode: segment.depCode ?? "",
        arrCode: segment.arrCode ?? "",
        depAt: maybeIso(segment.depAt),
        arrAt: maybeIso(segment.arrAt),
        classCode: segment.classCode ?? "",
        baggage: segment.baggage ?? "",
        hotelName: segment.hotelName ?? "",
        hotelAddress: segment.hotelAddress ?? "",
        checkIn: maybeIso(segment.checkIn),
        checkOut: maybeIso(segment.checkOut),
        roomType: segment.roomType ?? "",
        mealPlan: segment.mealPlan ?? "",
        operatorName: segment.operatorName ?? "",
        boardingPoint: segment.boardingPoint ?? "",
        dropPoint: segment.dropPoint ?? "",
      })),
    })),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}
