"use client";

import { useMemo, useState, useTransition } from "react";
import { Calendar, CheckCircle, Edit, Eye, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CustomerDto } from "@/modules/customers/application/customer-dto";
import type { VendorDto } from "@/modules/vendors/application/vendor-dto";
import {
  bookingStatuses,
  journeyModes,
  paxTypes,
  sexes,
  type BookingDto,
  type BookingInput,
  type BookingListDto,
  type BookingStatusLabel,
  type JourneyModeLabel,
  type PaxTypeLabel,
  type SexLabel,
} from "../../application/booking-dto";
import { deleteBookingAction, saveBookingAction, updateBookingStatusAction, type BookingActionResult } from "../actions/booking-actions";
import { Badge, PageHeader, StatCard, Table, TableBody, TableCell, TableHeader, TableRow } from "@/shared/presentation/components/server";
import { Button, Modal, Pagination, notify } from "@/shared/presentation/components/client";

type Props = {
  initial: BookingListDto;
  customers: CustomerDto[];
  vendors: VendorDto[];
};

type FilterState = {
  status: "" | BookingStatusLabel;
  paymentStatus: "" | "paid" | "partial" | "unpaid";
};

const emptyFilter: FilterState = { status: "", paymentStatus: "" };

export function BookingsPageClient({ customers, initial, vendors }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(emptyFilter);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<BookingDto | null>(null);
  const [viewing, setViewing] = useState<BookingDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookingDto | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return initial.data.filter((booking) => {
      const matchesText =
        !term ||
        [booking.packageName, booking.pnrNo, booking.customerName, booking.primaryPaxName, String(booking.totalAmount)]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = !filters.status || booking.status === filters.status;
      const matchesPayment =
        !filters.paymentStatus ||
        (filters.paymentStatus === "paid" && booking.dueAmount <= 0) ||
        (filters.paymentStatus === "partial" && booking.paidAmount > 0 && booking.dueAmount > 0) ||
        (filters.paymentStatus === "unpaid" && booking.paidAmount <= 0);
      return matchesText && matchesStatus && matchesPayment;
    });
  }, [filters, initial.data, query]);

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Management"
        description="Manage booking aggregates, nested PAX and itinerary details, travel dates, financial status, and status transitions."
        actions={
          <>
            <Button disabled={isPending} icon={RefreshCw} onClick={() => router.refresh()} variant="outline">
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => setEditing(newBooking(customers[0]?.id ?? "", vendors[0]?.id ?? ""))}>
              Create Booking
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard icon={Calendar} label="Total Bookings" value={initial.stats.totalBookings.toString()} tone="primary" />
        <StatCard icon={CheckCircle} label="Confirmed" value={initial.stats.confirmedBookings.toString()} />
        <StatCard label="Revenue" value={formatMoney(initial.stats.totalRevenue)} tone="success" />
        <StatCard label="Pending" value={formatMoney(initial.stats.pendingAmount)} tone="warning" />
      </div>

      <div className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[1fr_180px_180px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            className={inputClass("pl-9")}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search bookings by package, customer, PNR, PAX, or amount"
            value={query}
          />
        </label>
        <select className={inputClass()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as FilterState["status"] })}>
          <option value="">All statuses</option>
          {bookingStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select className={inputClass()} value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value as FilterState["paymentStatus"] })}>
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <Button variant="outline" onClick={() => { setQuery(""); setFilters(emptyFilter); setPage(1); }}>
          Clear
        </Button>
      </div>

      {visible.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Package</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Travel</TableCell>
                <TableCell header>PAX</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header className="text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell><strong>{booking.packageName || "Booking"}</strong><br /><span className="font-mono text-xs text-gray-500">{booking.pnrNo || "No PNR"}</span></TableCell>
                  <TableCell>{booking.customerName}<br /><span className="text-xs text-gray-500">{booking.vendorName || "No vendor"}</span></TableCell>
                  <TableCell>{formatDate(booking.travelStartAt || booking.bookingDate)}<br /><span className="text-xs text-gray-500">{booking.travelEndAt ? `to ${formatDate(booking.travelEndAt)}` : "End not set"}</span></TableCell>
                  <TableCell>{booking.paxCount} {booking.paxCount === 1 ? "person" : "people"}<br /><span className="text-xs text-gray-500">{booking.primaryPaxName || "No primary PAX"}</span></TableCell>
                  <TableCell>{formatMoney(booking.totalAmount)}<br /><span className="text-xs text-gray-500">Paid {formatMoney(booking.paidAmount)} / Due {formatMoney(booking.dueAmount)}</span></TableCell>
                  <TableCell><Badge variant={statusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button aria-label="View" icon={Eye} onClick={() => setViewing(booking)} size="icon" variant="outline" />
                      <Button aria-label="Edit" icon={Edit} onClick={() => setEditing(booking)} size="icon" variant="outline" />
                      <Button aria-label="Confirm" icon={CheckCircle} onClick={() => updateStatus(booking.id, "Confirmed")} size="icon" variant="outline" />
                      <Button aria-label="Cancel" icon={XCircle} onClick={() => updateStatus(booking.id, "Cancelled")} size="icon" variant="outline" />
                      <Button aria-label="Delete" icon={Trash2} onClick={() => setDeleteTarget(booking)} size="icon" variant="danger" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination currentPage={page} itemsPerPage={pageSize} onItemsPerPageChange={setPageSize} onPageChange={setPage} totalItems={filtered.length} />
        </>
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-base font-semibold text-gray-950 dark:text-gray-100">{query || filters.status || filters.paymentStatus ? "No bookings match current criteria" : "No bookings found"}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a booking with at least one PAX to start the reservation workflow.</p>
        </div>
      )}

      <BookingFormModal key={editing?.id ?? "closed"} booking={editing} customers={customers} isPending={isPending} onClose={() => setEditing(null)} onSaved={finish} startTransition={startTransition} vendors={vendors} />
      <BookingDetailsModal booking={viewing} onClose={() => setViewing(null)} />

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Booking" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">This will soft-delete <strong>{deleteTarget?.packageName || deleteTarget?.id}</strong> and refresh master-data booking counts.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button icon={Trash2} loading={isPending} onClick={() => deleteBooking()} variant="danger">Yes, delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  function updateStatus(id: string, status: BookingStatusLabel) {
    startTransition(async () => finish(await updateBookingStatusAction(id, { status, adminOverride: status === "Completed" })));
  }

  function deleteBooking() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteBookingAction(deleteTarget.id);
      finish(result);
      if (result.ok) setDeleteTarget(null);
    });
  }

  function finish(result: BookingActionResult) {
    notify({ kind: result.ok ? "success" : "error", message: result.message });
    if (result.ok) {
      setEditing(null);
      router.refresh();
    }
  }
}

function BookingFormModal({ booking, customers, isPending, onClose, onSaved, startTransition, vendors }: { booking: BookingDto | null; customers: CustomerDto[]; isPending: boolean; onClose: () => void; onSaved: (result: BookingActionResult) => void; startTransition: (callback: () => void) => void; vendors: VendorDto[] }) {
  const [form, setForm] = useState<BookingInput>(() => bookingToInput(booking));
  if (!booking) return null;
  return (
    <Modal isOpen onClose={onClose} title={booking.id ? "Edit Booking" : "Create Booking"} size="xl">
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); startTransition(async () => onSaved(await saveBookingAction(form, booking.id || undefined))); }}>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Customer"><select className={inputClass()} required value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></Field>
          <Field label="Vendor"><select className={inputClass()} value={form.vendorId ?? ""} onChange={(event) => setForm({ ...form, vendorId: event.target.value || undefined })}><option value="">No vendor</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></Field>
          <TextField label="Package" value={form.packageName} onChange={(packageName) => setForm({ ...form, packageName })} />
          <TextField label="PNR" value={form.pnrNo} onChange={(pnrNo) => setForm({ ...form, pnrNo })} />
          <TextField label="Booking Date" required type="date" value={dateInput(form.bookingDate)} onChange={(bookingDate) => setForm({ ...form, bookingDate })} />
          <Field label="Status"><select className={inputClass()} value={form.status ?? "Draft"} onChange={(event) => setForm({ ...form, status: event.target.value as BookingStatusLabel })}>{bookingStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
          <TextField label="Currency" required value={form.currency} onChange={(currency) => setForm({ ...form, currency: currency.toUpperCase() })} />
          <TextField label="Total Amount" required type="number" value={String(form.totalAmount)} onChange={(totalAmount) => setForm({ ...form, totalAmount: Number(totalAmount) })} />
          <TextField label="Paid Amount" type="number" value={String(form.paidAmount ?? 0)} onChange={(paidAmount) => setForm({ ...form, paidAmount: Number(paidAmount), advanceAmount: Number(paidAmount) })} />
        </section>

        <NestedSection title="Passengers" onAdd={() => setForm({ ...form, pax: [...form.pax, emptyPax()] })}>
          {form.pax.map((pax, index) => (
            <div className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-800 md:grid-cols-5" key={index}>
              <TextField label="Name" required value={pax.paxName} onChange={(paxName) => updatePax(index, { paxName })} />
              <Field label="Type"><select className={inputClass()} value={pax.paxType} onChange={(event) => updatePax(index, { paxType: event.target.value as PaxTypeLabel })}>{paxTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label="Sex"><select className={inputClass()} value={pax.sex ?? ""} onChange={(event) => updatePax(index, { sex: event.target.value as SexLabel | "" })}><option value="">Not set</option>{sexes.map((sex) => <option key={sex}>{sex}</option>)}</select></Field>
              <TextField label="Passport" value={pax.passportNo} onChange={(passportNo) => updatePax(index, { passportNo })} />
              <div className="flex items-end gap-2"><TextField label="DOB" type="date" value={dateInput(pax.dob)} onChange={(dob) => updatePax(index, { dob })} /><Button disabled={form.pax.length === 1} onClick={() => setForm({ ...form, pax: form.pax.filter((_, i) => i !== index) })} type="button" variant="outline">Remove</Button></div>
            </div>
          ))}
        </NestedSection>

        <NestedSection title="Itineraries" onAdd={() => setForm({ ...form, itineraries: [...form.itineraries, emptyItinerary(form.itineraries.length + 1)] })}>
          {form.itineraries.map((itinerary, itineraryIndex) => (
            <div className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-800" key={itineraryIndex}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_auto_auto]">
                <TextField label="Itinerary Name" value={itinerary.name} onChange={(name) => updateItinerary(itineraryIndex, { name })} />
                <TextField label="Seq" type="number" value={String(itinerary.seqNo)} onChange={(seqNo) => updateItinerary(itineraryIndex, { seqNo: Number(seqNo) })} />
                <Button onClick={() => addSegment(itineraryIndex)} type="button" variant="outline">Add Segment</Button>
                <Button disabled={form.itineraries.length === 1} onClick={() => setForm({ ...form, itineraries: form.itineraries.filter((_, i) => i !== itineraryIndex) })} type="button" variant="outline">Remove</Button>
              </div>
              {itinerary.segments.map((segment, segmentIndex) => (
                <div className="grid grid-cols-1 gap-3 bg-gray-50 p-3 dark:bg-gray-950 md:grid-cols-4" key={segmentIndex}>
                  <Field label="Mode"><select className={inputClass()} value={segment.modeOfJourney} onChange={(event) => updateSegment(itineraryIndex, segmentIndex, { modeOfJourney: event.target.value as JourneyModeLabel })}>{journeyModes.map((mode) => <option key={mode}>{mode}</option>)}</select></Field>
                  <TextField label={segment.modeOfJourney === "HOTEL" ? "Hotel Name" : "Dep Code"} value={segment.modeOfJourney === "HOTEL" ? segment.hotelName : segment.depCode} onChange={(value) => updateSegment(itineraryIndex, segmentIndex, segment.modeOfJourney === "HOTEL" ? { hotelName: value } : { depCode: value.toUpperCase() })} />
                  <TextField label={segment.modeOfJourney === "HOTEL" ? "Check In" : "Departure"} type="datetime-local" value={dateTimeInput(segment.modeOfJourney === "HOTEL" ? segment.checkIn : segment.depAt)} onChange={(value) => updateSegment(itineraryIndex, segmentIndex, segment.modeOfJourney === "HOTEL" ? { checkIn: value } : { depAt: value })} />
                  <TextField label={segment.modeOfJourney === "HOTEL" ? "Check Out" : "Arrival"} type="datetime-local" value={dateTimeInput(segment.modeOfJourney === "HOTEL" ? segment.checkOut : segment.arrAt)} onChange={(value) => updateSegment(itineraryIndex, segmentIndex, segment.modeOfJourney === "HOTEL" ? { checkOut: value } : { arrAt: value })} />
                  <TextField label="Service/Carrier" value={segment.serviceNumber || segment.carrierCode} onChange={(serviceNumber) => updateSegment(itineraryIndex, segmentIndex, { serviceNumber, carrierCode: serviceNumber })} />
                  <TextField label="Boarding Point" value={segment.boardingPoint} onChange={(boardingPoint) => updateSegment(itineraryIndex, segmentIndex, { boardingPoint })} />
                  <TextField label="Drop/Arr Code" value={segment.dropPoint || segment.arrCode} onChange={(value) => updateSegment(itineraryIndex, segmentIndex, { dropPoint: value, arrCode: value.toUpperCase() })} />
                  <Button onClick={() => removeSegment(itineraryIndex, segmentIndex)} type="button" variant="outline">Remove Segment</Button>
                </div>
              ))}
            </div>
          ))}
        </NestedSection>

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button onClick={onClose} type="button" variant="outline">Cancel</Button>
          <Button loading={isPending} type="submit">{booking.id ? "Update Booking" : "Create Booking"}</Button>
        </div>
      </form>
    </Modal>
  );

  function updatePax(index: number, patch: Partial<BookingInput["pax"][number]>) {
    setForm({ ...form, pax: form.pax.map((pax, i) => i === index ? { ...pax, ...patch } : pax) });
  }
  function updateItinerary(index: number, patch: Partial<BookingInput["itineraries"][number]>) {
    setForm({ ...form, itineraries: form.itineraries.map((itinerary, i) => i === index ? { ...itinerary, ...patch } : itinerary) });
  }
  function addSegment(index: number) {
    setForm({ ...form, itineraries: form.itineraries.map((itinerary, i) => i === index ? { ...itinerary, segments: [...itinerary.segments, emptySegment(itinerary.segments.length + 1)] } : itinerary) });
  }
  function updateSegment(itineraryIndex: number, segmentIndex: number, patch: Partial<BookingInput["itineraries"][number]["segments"][number]>) {
    setForm({ ...form, itineraries: form.itineraries.map((itinerary, i) => i === itineraryIndex ? { ...itinerary, segments: itinerary.segments.map((segment, s) => s === segmentIndex ? { ...segment, ...patch } : segment) } : itinerary) });
  }
  function removeSegment(itineraryIndex: number, segmentIndex: number) {
    setForm({ ...form, itineraries: form.itineraries.map((itinerary, i) => i === itineraryIndex ? { ...itinerary, segments: itinerary.segments.filter((_, s) => s !== segmentIndex) } : itinerary) });
  }
}

function BookingDetailsModal({ booking, onClose }: { booking: BookingDto | null; onClose: () => void }) {
  return (
    <Modal isOpen={Boolean(booking)} onClose={onClose} title="View Booking" size="xl">
      {booking ? (
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard label="Customer" value={booking.customerName} />
            <StatCard label="Total" value={formatMoney(booking.totalAmount)} />
            <StatCard label="Due" value={formatMoney(booking.dueAmount)} tone={booking.dueAmount > 0 ? "warning" : "success"} />
          </div>
          <Table>
            <TableHeader><TableRow><TableCell header>PAX</TableCell><TableCell header>Type</TableCell><TableCell header>Passport</TableCell></TableRow></TableHeader>
            <TableBody>{booking.pax.map((pax) => <TableRow key={pax.id}><TableCell>{pax.paxName}</TableCell><TableCell>{pax.paxType}</TableCell><TableCell>{pax.passportNo || "-"}</TableCell></TableRow>)}</TableBody>
          </Table>
          <Table>
            <TableHeader><TableRow><TableCell header>Itinerary</TableCell><TableCell header>Mode</TableCell><TableCell header>From</TableCell><TableCell header>To</TableCell></TableRow></TableHeader>
            <TableBody>{booking.itineraries.flatMap((itinerary) => itinerary.segments.map((segment) => <TableRow key={segment.id}><TableCell>{itinerary.name}</TableCell><TableCell>{segment.modeOfJourney}</TableCell><TableCell>{segment.depCode || segment.hotelName || segment.boardingPoint || "-"}</TableCell><TableCell>{segment.arrCode || segment.dropPoint || "-"}</TableCell></TableRow>))}</TableBody>
          </Table>
        </div>
      ) : null}
    </Modal>
  );
}

function NestedSection({ children, onAdd, title }: { children: React.ReactNode; onAdd: () => void; title: string }) {
  return <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-950 dark:text-gray-100">{title}</h3><Button onClick={onAdd} type="button" variant="outline">Add</Button></div>{children}</section>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">{label}{children}</label>;
}

function TextField({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value?: string }) {
  return <Field label={label}><input className={inputClass()} required={required} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function bookingToInput(booking: BookingDto | null): BookingInput {
  if (!booking) return newBooking("", "");
  return {
    customerId: booking.customerId,
    vendorId: booking.vendorId || undefined,
    bookingDate: dateInput(booking.bookingDate),
    currency: booking.currency,
    totalAmount: booking.totalAmount,
    paidAmount: booking.paidAmount,
    advanceAmount: booking.advanceAmount,
    packageName: booking.packageName,
    pnrNo: booking.pnrNo,
    modeOfJourney: booking.modeOfJourney,
    status: booking.status,
    pax: booking.pax.map(({ dob, passportNo, paxName, paxType, sex }) => ({ dob: dateInput(dob), passportNo, paxName, paxType, sex })),
    itineraries: booking.itineraries.map((itinerary) => ({
      name: itinerary.name,
      seqNo: itinerary.seqNo,
      segments: itinerary.segments.map((segment) => ({
        seqNo: segment.seqNo,
        modeOfJourney: segment.modeOfJourney,
        carrierCode: segment.carrierCode,
        serviceNumber: segment.serviceNumber,
        depCode: segment.depCode,
        arrCode: segment.arrCode,
        depAt: segment.depAt,
        arrAt: segment.arrAt,
        classCode: segment.classCode,
        baggage: segment.baggage,
        hotelName: segment.hotelName,
        hotelAddress: segment.hotelAddress,
        checkIn: segment.checkIn,
        checkOut: segment.checkOut,
        roomType: segment.roomType,
        mealPlan: segment.mealPlan,
        operatorName: segment.operatorName,
        boardingPoint: segment.boardingPoint,
        dropPoint: segment.dropPoint,
      })),
    })),
  };
}

function newBooking(customerId: string, vendorId: string): BookingDto {
  const now = new Date().toISOString();
  return {
    id: "",
    orgId: "",
    customerId,
    customerName: "",
    customer: null,
    vendorId,
    vendorName: "",
    vendor: null,
    bookingDate: now,
    currency: "INR",
    totalAmount: 1,
    paidAmount: 0,
    refundedAmount: 0,
    dueAmount: 1,
    paxCount: 1,
    primaryPaxName: "",
    travelStartAt: "",
    travelEndAt: "",
    packageName: "",
    pnrNo: "",
    modeOfJourney: "FLIGHT",
    advanceAmount: 0,
    status: "Draft",
    pax: [{ id: "", ...emptyPaxDto() }],
    itineraries: [emptyItineraryDto(1)],
    createdAt: now,
    updatedAt: now,
  };
}

function emptyPax(): BookingInput["pax"][number] {
  return { paxName: "", paxType: "ADT", sex: "", passportNo: "", dob: "" };
}

function emptyItinerary(seqNo: number): BookingInput["itineraries"][number] {
  return { name: `Itinerary ${seqNo}`, seqNo, segments: [emptySegment(1)] };
}

function emptyItineraryDto(seqNo: number) {
  return { id: "", name: `Itinerary ${seqNo}`, seqNo, segments: [{ id: "", ...emptySegmentDto(1) }] };
}

function emptyPaxDto() {
  return { paxName: "", paxType: "ADT" as const, sex: "" as const, passportNo: "", dob: "" };
}

function emptySegmentDto(seqNo: number) {
  return {
    seqNo,
    modeOfJourney: "FLIGHT" as const,
    carrierCode: "",
    serviceNumber: "",
    depCode: "",
    arrCode: "",
    depAt: "",
    arrAt: "",
    classCode: "",
    baggage: "",
    hotelName: "",
    hotelAddress: "",
    checkIn: "",
    checkOut: "",
    roomType: "",
    mealPlan: "",
    operatorName: "",
    boardingPoint: "",
    dropPoint: "",
  };
}

function emptySegment(seqNo: number): BookingInput["itineraries"][number]["segments"][number] {
  return { seqNo, modeOfJourney: "FLIGHT", carrierCode: "", serviceNumber: "", depCode: "", arrCode: "", depAt: "", arrAt: "", classCode: "", baggage: "", hotelName: "", hotelAddress: "", checkIn: "", checkOut: "", roomType: "", mealPlan: "", operatorName: "", boardingPoint: "", dropPoint: "" };
}

function statusVariant(status: BookingStatusLabel): "default" | "success" | "warning" | "danger" {
  if (status === "Confirmed" || status === "Ticketed" || status === "Completed") return "success";
  if (status === "Draft" || status === "In Progress") return "warning";
  if (status === "Cancelled" || status === "Refunded") return "danger";
  return "default";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", maximumFractionDigits: 0, style: "currency" }).format(value);
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function dateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
}

function dateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 16);
}

function inputClass(extra = "") {
  return `h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 ${extra}`;
}
