import "server-only";
import { BookingStatus, PaymentType, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import { getReportCatalogItem } from "../application/report-catalog";
import type { ReportColumn, ReportFilters, ReportId, ReportResultDto, ReportRow } from "../application/report-dto";
import type { ReportCachePort } from "../domain/report-cache";
import { MemoryReportCache } from "./memory-report-cache";

const REPORT_TTL_SECONDS = 300;

const bookingInclude = { customer: true, vendor: true } as const;
const paymentInclude = { booking: { include: { customer: true, vendor: true } }, customer: true, vendor: true } as const;

type BookingRecord = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;
type PaymentRecord = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;

type Dataset = {
  bookings: BookingRecord[];
  payments: PaymentRecord[];
};

export class PrismaReportService {
  constructor(private readonly cache: ReportCachePort = new MemoryReportCache()) {}

  async run(actor: ActorContext, reportId: ReportId, filters: ReportFilters): Promise<ReportResultDto> {
    const cacheKey = cacheKeyFor(actor.orgId, reportId, filters);
    const cached = await this.cache.get<ReportResultDto>(cacheKey);
    if (cached) return cached;

    const dataset = await this.loadDataset(actor);
    const result = this.build(reportId, dataset, filters);
    await this.cache.set(cacheKey, result, REPORT_TTL_SECONDS);
    return result;
  }

  private async loadDataset(actor: ActorContext): Promise<Dataset> {
    const [bookings, payments] = await Promise.all([
      prisma.booking.findMany({
        where: { orgId: actor.orgId, isDeleted: false, deletedAt: null },
        include: bookingInclude,
        orderBy: { bookingDate: "desc" },
      }),
      prisma.payment.findMany({
        where: { orgId: actor.orgId, isDeleted: false, deletedAt: null },
        include: paymentInclude,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { bookings, payments };
  }

  private build(reportId: ReportId, dataset: Dataset, filters: ReportFilters): ReportResultDto {
    switch (reportId) {
      case "sales-by-customer-detail":
        return this.salesByCustomer(reportId, dataset, filters);
      case "customer-balance-detail":
      case "customer-ledger":
        return this.customerLedger(reportId, dataset, filters);
      case "customer-payment-details":
      case "payment-details-by-customer":
      case "payment-splits-by-customer":
        return this.customerPayments(reportId, dataset, filters);
      case "invoice-credit-note-list-by-date":
        return this.invoiceCreditNotes(reportId, dataset, filters);
      case "invoice-list":
        return this.invoiceList(reportId, dataset, filters);
      case "invoices-by-month":
        return this.invoicesByMonth(reportId, dataset, filters);
      case "sales-by-product-service-detail":
        return this.salesByService(reportId, dataset, filters);
      case "transaction-list-by-customer":
      case "transaction-list-by-date":
        return this.customerTransactions(reportId, dataset, filters);
      case "vendor-ledger":
        return this.vendorLedger(reportId, dataset, filters);
      case "outstanding-payments":
        return this.outstandingPayments(reportId, dataset, filters);
      case "monthly-income-expense":
        return this.monthlyIncomeExpense(reportId, dataset, filters);
      case "refund-register":
        return this.refundRegister(reportId, dataset, filters);
      case "booking-register":
        return this.bookingRegister(reportId, dataset, filters);
      case "gst-view":
        return this.gstView(reportId, dataset, filters);
    }
  }

  async customerBookings(actor: ActorContext, filters: ReportFilters): Promise<ReportResultDto> {
    const dataset = await this.loadDataset(actor);
    const bookings = this.filterBookings(dataset.bookings, filters, { dateField: "bookingDate", excludeCancelled: true });
    const rows = bookings.map((booking) => ({
      bookingDate: booking.bookingDate.toISOString(),
      customer: booking.customer.name,
      contact: booking.customer.email || booking.customer.phone || "",
      bookingRef: booking.pnrNo || booking.id,
      packageName: booking.packageName || booking.primaryPaxName || "Booking",
      status: fromEnum(booking.status),
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      dueAmount: Number(booking.dueAmount),
      travelStart: iso(booking.travelStartAt),
    }));
    return this.result("customer-report-existing", "Customer Bookings Report", filters, customerReportColumns(), this.searchRows(rows, filters.search), {
      bookingCount: rows.length,
      totalAmount: sum(rows, "totalAmount"),
      totalPaid: sum(rows, "paidAmount"),
      totalDue: sum(rows, "dueAmount"),
    });
  }

  async vendorExpenses(actor: ActorContext, filters: ReportFilters): Promise<ReportResultDto> {
    const dataset = await this.loadDataset(actor);
    const rows = dataset.payments
      .filter((payment) => payment.paymentType === PaymentType.EXPENSE)
      .filter((payment) => between(payment.createdAt, filters.startDate, filters.endDate))
      .filter((payment) => (filters.vendorIds.length ? payment.vendorId && filters.vendorIds.includes(payment.vendorId) : true))
      .map((payment) => ({
        paymentDate: payment.createdAt.toISOString(),
        vendor: payment.vendor?.name || "Unknown Vendor",
        serviceType: payment.vendor?.serviceType ? fromEnum(payment.vendor.serviceType) : "",
        receiptNo: payment.receiptNo || payment.id,
        category: payment.category || "",
        paymentMode: payment.paymentMode,
        amount: Number(payment.amount),
        notes: payment.notes || "",
      }));
    const searched = this.searchRows(rows, filters.search);
    return this.result("vendor-report-existing", "Vendor Expense Report", filters, vendorReportColumns(), searched, {
      paymentCount: searched.length,
      totalPaid: sum(searched, "amount"),
    });
  }

  private salesByCustomer(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows: ReportRow[] = this.invoiceRows(dataset.bookings, filters);
    if (filters.includePaymentDetails) rows.push(...this.paymentRows(dataset.payments, filters, [PaymentType.RECEIVABLE]));
    if (filters.includeRefunds) rows.push(...this.paymentRows(dataset.payments, filters, [PaymentType.REFUND_OUTBOUND]));
    const searched = this.sortRows(this.searchRows(rows, filters.search), "date", filters.sortOrder);
    return this.result(reportId, titleFor(reportId), filters, transactionColumns(), searched, {
      invoiceTotal: sumType(searched, "Invoice"),
      paymentTotal: sumType(searched, "Payment"),
      creditMemoTotal: sumType(searched, "Credit Memo"),
      netBalance: sum(searched, "amount"),
      transactionCount: searched.length,
    });
  }

  private customerLedger(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const events = this.customerEvents(dataset, filters, false);
    const rows: ReportRow[] = [];
    const byCustomer = groupBy(events, "customerId");
    for (const [, customerEvents] of byCustomer) {
      const ordered = this.sortRows(customerEvents, "date", "asc");
      let running = ordered.filter((event) => new Date(String(event.date)) < filters.startDate).reduce((total, event) => total + Number(event.signedAmount), 0);
      const inPeriod = ordered.filter((event) => between(new Date(String(event.date)), filters.startDate, filters.endDate));
      if (!filters.includeZeroBalance && running === 0 && inPeriod.length === 0) continue;
      rows.push({ customer: String(ordered[0]?.customer || "Unknown Customer"), date: filters.startDate.toISOString(), transactionType: "Opening Balance", refNo: "", description: "Opening balance before interval", debit: running > 0 ? running : null, credit: running < 0 ? Math.abs(running) : null, balance: round(running) });
      for (const event of inPeriod) {
        running += Number(event.signedAmount);
        rows.push({ customer: event.customer, date: event.date, transactionType: event.transactionType, refNo: event.refNo, description: event.description, debit: Number(event.signedAmount) > 0 ? event.amount : null, credit: Number(event.signedAmount) < 0 ? event.amount : null, balance: round(running) });
      }
      rows.push({ customer: String(ordered[0]?.customer || "Unknown Customer"), date: filters.endDate.toISOString(), transactionType: "Closing Balance", refNo: "", description: "Closing balance for interval", debit: running > 0 ? running : null, credit: running < 0 ? Math.abs(running) : null, balance: round(running) });
    }
    const searched = this.searchRows(rows, filters.search);
    return this.result(reportId, titleFor(reportId), filters, ledgerColumns(), searched, { statementRows: searched.length, closingBalanceTotal: sum(searched.filter((row) => row.transactionType === "Closing Balance"), "balance") });
  }

  private customerPayments(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const types = filters.includeRefunds ? [PaymentType.RECEIVABLE, PaymentType.REFUND_OUTBOUND] : [PaymentType.RECEIVABLE];
    const rows = this.paymentRows(dataset.payments, filters, types).map((row) => ({ paymentDate: row.date, customer: row.customer, receiptRef: row.refNo, bookingRef: row.bookingRef, productService: row.productService, paymentMode: row.paymentMode, amount: Math.abs(Number(row.amount)), notes: row.description, direction: row.transactionType === "Payment" ? "IN" : "OUT" }));
    const searched = this.searchRows(rows, filters.search);
    return this.result(reportId, titleFor(reportId), filters, paymentColumns(), searched, { totalReceived: sum(searched.filter((row) => row.direction === "IN"), "amount"), totalRefunded: sum(searched.filter((row) => row.direction === "OUT"), "amount"), transactionCount: searched.length });
  }

  private invoiceCreditNotes(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows = [...this.invoiceRows(dataset.bookings, filters), ...this.paymentRows(dataset.payments, filters, [PaymentType.REFUND_OUTBOUND])];
    const searched = this.searchRows(rows, filters.search);
    return this.result(reportId, titleFor(reportId), filters, transactionColumns(), searched, { rowCount: searched.length, invoiceTotal: sumType(searched, "Invoice"), creditMemoTotal: sumType(searched, "Credit Memo") });
  }

  private invoiceList(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows = this.filterBookings(dataset.bookings, filters, { dateField: "bookingDate", excludeCancelled: true }).map((booking) => bookingRow(booking));
    const searched = this.searchRows(rows, filters.search);
    return this.result(reportId, titleFor(reportId), filters, bookingColumns(), searched, { invoiceCount: searched.length, totalAmount: sum(searched, "totalAmount"), totalDue: sum(searched, "dueAmount") });
  }

  private invoicesByMonth(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const groups = new Map<string, ReportRow>();
    for (const booking of this.filterBookings(dataset.bookings, filters, { dateField: "bookingDate", excludeCancelled: true })) {
      const key = monthKey(booking.bookingDate);
      const row = groups.get(key) ?? { month: key, invoiceCount: 0, invoiceTotal: 0, paidTotal: 0, dueTotal: 0 };
      row.invoiceCount = Number(row.invoiceCount) + 1;
      row.invoiceTotal = Number(row.invoiceTotal) + Number(booking.totalAmount);
      row.paidTotal = Number(row.paidTotal) + Number(booking.paidAmount);
      row.dueTotal = Number(row.dueTotal) + Number(booking.dueAmount);
      groups.set(key, row);
    }
    const rows = [...groups.values()].sort((a, b) => String(a.month).localeCompare(String(b.month)));
    return this.result(reportId, titleFor(reportId), filters, monthlyInvoiceColumns(), rows, { monthCount: rows.length, invoiceTotal: sum(rows, "invoiceTotal"), dueTotal: sum(rows, "dueTotal") });
  }

  private salesByService(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const groups = new Map<string, ReportRow>();
    for (const booking of this.filterBookings(dataset.bookings, filters, { dateField: "bookingDate", excludeCancelled: true })) {
      const key = serviceLabel(booking);
      const row = groups.get(key) ?? { productService: key, bookingCount: 0, paxCount: 0, totalAmount: 0, paidAmount: 0, dueAmount: 0 };
      row.bookingCount = Number(row.bookingCount) + 1;
      row.paxCount = Number(row.paxCount) + booking.paxCount;
      row.totalAmount = Number(row.totalAmount) + Number(booking.totalAmount);
      row.paidAmount = Number(row.paidAmount) + Number(booking.paidAmount);
      row.dueAmount = Number(row.dueAmount) + Number(booking.dueAmount);
      groups.set(key, row);
    }
    const rows = this.searchRows([...groups.values()], filters.search);
    return this.result(reportId, titleFor(reportId), filters, serviceColumns(), rows, { serviceCount: rows.length, totalAmount: sum(rows, "totalAmount"), totalDue: sum(rows, "dueAmount") });
  }

  private customerTransactions(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows = this.customerEvents(dataset, filters, true);
    const searched = this.searchRows(rows, filters.search);
    return this.result(reportId, titleFor(reportId), filters, transactionColumns(), searched, { transactionCount: searched.length, invoiceTotal: sumType(searched, "Invoice"), paymentTotal: sumType(searched, "Payment"), creditMemoTotal: sumType(searched, "Credit Memo") });
  }

  private vendorLedger(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows = this.vendorEvents(dataset, filters);
    return this.result(reportId, titleFor(reportId), filters, vendorLedgerColumns(), rows, { transactionCount: rows.length, expenseTotal: sumType(rows, "Expense"), vendorRefundTotal: sumType(rows, "Vendor Refund"), netExpense: sum(rows, "signedAmount") });
  }

  private outstandingPayments(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows = this.filterBookings(dataset.bookings, { ...filters, pendingOnly: true }, { dateField: "bookingDate", excludeCancelled: true }).map((booking) => bookingRow(booking));
    const searched = this.searchRows(rows, filters.search);
    return this.result(reportId, titleFor(reportId), filters, bookingColumns(), searched, { bookingCount: searched.length, outstandingTotal: sum(searched, "dueAmount") });
  }

  private monthlyIncomeExpense(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const groups = new Map<string, ReportRow>();
    const ensure = (date: Date) => {
      const key = monthKey(date);
      const row = groups.get(key) ?? { month: key, invoiceTotal: 0, receivedTotal: 0, expenseTotal: 0, refundTotal: 0, netCashflow: 0 };
      groups.set(key, row);
      return row;
    };
    for (const booking of this.filterBookings(dataset.bookings, filters, { dateField: "bookingDate", excludeCancelled: true })) ensure(booking.bookingDate).invoiceTotal = Number(ensure(booking.bookingDate).invoiceTotal) + Number(booking.totalAmount);
    for (const payment of dataset.payments.filter((payment) => between(payment.createdAt, filters.startDate, filters.endDate))) {
      const row = ensure(payment.createdAt);
      if (payment.paymentType === PaymentType.RECEIVABLE) row.receivedTotal = Number(row.receivedTotal) + Number(payment.amount);
      if (payment.paymentType === PaymentType.EXPENSE) row.expenseTotal = Number(row.expenseTotal) + Number(payment.amount);
      if (payment.paymentType === PaymentType.REFUND_INBOUND || payment.paymentType === PaymentType.REFUND_OUTBOUND) row.refundTotal = Number(row.refundTotal) + Number(payment.amount);
      row.netCashflow = Number(row.receivedTotal) - Number(row.expenseTotal) - Number(row.refundTotal);
    }
    const rows = [...groups.values()].sort((a, b) => String(a.month).localeCompare(String(b.month)));
    return this.result(reportId, titleFor(reportId), filters, monthlyIncomeColumns(), rows, { monthCount: rows.length, receivedTotal: sum(rows, "receivedTotal"), expenseTotal: sum(rows, "expenseTotal"), netCashflow: sum(rows, "netCashflow") });
  }

  private refundRegister(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows = dataset.payments
      .filter((payment) => payment.paymentType === PaymentType.REFUND_INBOUND || payment.paymentType === PaymentType.REFUND_OUTBOUND)
      .filter((payment) => between(payment.createdAt, filters.startDate, filters.endDate))
      .filter((payment) => (filters.paymentModes.length ? filters.paymentModes.includes(payment.paymentMode) : true))
      .map((payment) => ({ date: payment.createdAt.toISOString(), direction: payment.paymentType === PaymentType.REFUND_OUTBOUND ? "Customer Refund" : "Vendor Refund", refNo: payment.receiptNo || payment.id, party: payment.customer?.name || payment.vendor?.name || payment.booking?.customer.name || "", paymentMode: payment.paymentMode, amount: Number(payment.amount), notes: payment.notes || "" }));
    const searched = this.searchRows(rows, filters.search);
    return this.result(reportId, titleFor(reportId), filters, refundColumns(), searched, { refundCount: searched.length, totalRefundAmount: sum(searched, "amount") });
  }

  private bookingRegister(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows = this.filterBookings(dataset.bookings, filters, { dateField: "bookingDate", excludeCancelled: false }).map((booking) => bookingRow(booking));
    const searched = this.searchRows(rows, filters.search);
    return this.result(reportId, titleFor(reportId), filters, bookingColumns(), searched, { bookingCount: searched.length, totalAmount: sum(searched, "totalAmount"), totalDue: sum(searched, "dueAmount") });
  }

  private gstView(reportId: ReportId, dataset: Dataset, filters: ReportFilters) {
    const rows = this.filterBookings(dataset.bookings, filters, { dateField: "bookingDate", excludeCancelled: true }).map((booking) => ({ date: booking.bookingDate.toISOString(), bookingRef: booking.pnrNo || booking.id, customer: booking.customer.name, taxableValue: Number(booking.totalAmount), cgst: null, sgst: null, igst: null, totalTax: null, totalAmount: Number(booking.totalAmount) }));
    return this.result(reportId, titleFor(reportId), filters, gstColumns(), rows, { rowCount: rows.length, totalAmount: sum(rows, "totalAmount") }, ["Travox does not currently store canonical GST split fields.", "GST component columns are intentionally blank instead of inferred."]);
  }

  private filterBookings(bookings: BookingRecord[], filters: ReportFilters, options: { dateField: "bookingDate" | "createdAt"; excludeCancelled: boolean }) {
    return bookings
      .filter((booking) => (options.excludeCancelled ? booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.REFUNDED : true))
      .filter((booking) => between(booking[options.dateField], filters.startDate, filters.endDate))
      .filter((booking) => (filters.customerIds.length ? filters.customerIds.includes(booking.customerId) : true))
      .filter((booking) => (filters.vendorIds.length ? booking.vendorId && filters.vendorIds.includes(booking.vendorId) : true))
      .filter((booking) => (filters.pendingOnly ? Number(booking.dueAmount) > 0 : true))
      .filter((booking) => (filters.serviceTypes.length ? filters.serviceTypes.includes(serviceLabel(booking)) : true));
  }

  private invoiceRows(bookings: BookingRecord[], filters: ReportFilters) {
    return this.filterBookings(bookings, filters, { dateField: "bookingDate", excludeCancelled: true }).map((booking) => ({
      date: booking.bookingDate.toISOString(),
      transactionType: "Invoice",
      refNo: booking.pnrNo || booking.id,
      customer: booking.customer.name,
      customerId: booking.customerId,
      bookingRef: booking.pnrNo || booking.id,
      productService: serviceLabel(booking),
      description: booking.packageName || booking.primaryPaxName || "Booking charge",
      amount: Number(booking.totalAmount),
      signedAmount: Number(booking.totalAmount),
    }));
  }

  private paymentRows(payments: PaymentRecord[], filters: ReportFilters, types: PaymentType[]) {
    return payments
      .filter((payment) => types.includes(payment.paymentType))
      .filter((payment) => between(payment.createdAt, filters.startDate, filters.endDate))
      .filter((payment) => (filters.customerIds.length ? payment.customerId && filters.customerIds.includes(payment.customerId) : true))
      .filter((payment) => (filters.paymentModes.length ? filters.paymentModes.includes(payment.paymentMode) : true))
      .map((payment) => ({
        date: payment.createdAt.toISOString(),
        transactionType: payment.paymentType === PaymentType.RECEIVABLE ? "Payment" : "Credit Memo",
        refNo: payment.receiptNo || payment.id,
        customer: payment.customer?.name || payment.booking?.customer.name || "Unknown Customer",
        customerId: payment.customerId || payment.booking?.customerId || "",
        bookingRef: payment.booking?.pnrNo || payment.bookingId || "",
        productService: payment.booking ? serviceLabel(payment.booking) : "Booking",
        paymentMode: payment.paymentMode,
        description: payment.notes || (payment.paymentType === PaymentType.RECEIVABLE ? "Receivable payment" : "Customer refund"),
        amount: payment.paymentType === PaymentType.RECEIVABLE ? -Number(payment.amount) : -Number(payment.amount),
        signedAmount: -Number(payment.amount),
      }));
  }

  private customerEvents(dataset: Dataset, filters: ReportFilters, inPeriodOnly: boolean) {
    const events = [
      ...this.invoiceRows(dataset.bookings, { ...filters, startDate: inPeriodOnly ? filters.startDate : new Date(0) }),
      ...this.paymentRows(dataset.payments, { ...filters, startDate: inPeriodOnly ? filters.startDate : new Date(0) }, filters.includeRefunds ? [PaymentType.RECEIVABLE, PaymentType.REFUND_OUTBOUND] : [PaymentType.RECEIVABLE]),
    ];
    return this.sortRows(events, filters.sortBy || "date", filters.sortOrder);
  }

  private vendorEvents(dataset: Dataset, filters: ReportFilters) {
    let runningByVendor = new Map<string, number>();
    const rows = dataset.payments
      .filter((payment) => payment.paymentType === PaymentType.EXPENSE || payment.paymentType === PaymentType.REFUND_INBOUND)
      .filter((payment) => between(payment.createdAt, filters.startDate, filters.endDate))
      .filter((payment) => (filters.vendorIds.length ? payment.vendorId && filters.vendorIds.includes(payment.vendorId) : true))
      .filter((payment) => (filters.paymentModes.length ? filters.paymentModes.includes(payment.paymentMode) : true))
      .map((payment) => {
        const vendorId = payment.vendorId || "";
        const signed = payment.paymentType === PaymentType.EXPENSE ? Number(payment.amount) : -Number(payment.amount);
        const running = round((runningByVendor.get(vendorId) ?? 0) + signed);
        runningByVendor = runningByVendor.set(vendorId, running);
        return { date: payment.createdAt.toISOString(), transactionType: payment.paymentType === PaymentType.EXPENSE ? "Expense" : "Vendor Refund", refNo: payment.receiptNo || payment.id, vendor: payment.vendor?.name || "Unknown Vendor", paymentMode: payment.paymentMode, amount: Math.abs(Number(payment.amount)), signedAmount: signed, balance: running, notes: payment.notes || payment.category || "" };
      });
    return this.searchRows(rows, filters.search);
  }

  private searchRows<T extends ReportRow>(rows: T[], search: string): T[] {
    if (!search) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(term));
  }

  private sortRows<T extends ReportRow>(rows: T[], sortBy: string, sortOrder: "asc" | "desc") {
    return [...rows].sort((left, right) => {
      const comparison = String(left[sortBy] ?? "").localeCompare(String(right[sortBy] ?? ""), undefined, { numeric: true });
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }

  private result(reportId: string, title: string, filters: ReportFilters, columns: ReportColumn[], rows: ReportRow[], totals: Record<string, number>, notes?: string[]): ReportResultDto {
    return {
      data: rows,
      count: rows.length,
      columns,
      meta: {
        reportId,
        title,
        generatedAt: new Date().toISOString(),
        interval: { start: filters.startDate.toISOString(), end: filters.endDate.toISOString() },
        totals: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, round(value)])),
        notes,
      },
    };
  }
}

function cacheKeyFor(orgId: string, reportId: string, filters: ReportFilters) {
  return `report:center:${orgId}:${reportId}:${JSON.stringify({
    start: filters.startDate.toISOString(),
    end: filters.endDate.toISOString(),
    customerIds: [...filters.customerIds].sort(),
    vendorIds: [...filters.vendorIds].sort(),
    transactionTypes: [...filters.transactionTypes].sort(),
    paymentModes: [...filters.paymentModes].sort(),
    serviceTypes: [...filters.serviceTypes].sort(),
    pendingOnly: filters.pendingOnly,
    search: filters.search,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    includeRefunds: filters.includeRefunds,
    includePaymentDetails: filters.includePaymentDetails,
    includeZeroBalance: filters.includeZeroBalance,
    bookingId: filters.bookingId,
  })}`;
}

function titleFor(reportId: string) {
  return getReportCatalogItem(reportId)?.label ?? "Report";
}

function bookingRow(booking: BookingRecord): ReportRow {
  return {
    bookingDate: booking.bookingDate.toISOString(),
    bookingRef: booking.pnrNo || booking.id,
    customer: booking.customer.name,
    vendor: booking.vendor?.name || "",
    productService: serviceLabel(booking),
    status: fromEnum(booking.status),
    paxCount: booking.paxCount,
    totalAmount: Number(booking.totalAmount),
    paidAmount: Number(booking.paidAmount),
    dueAmount: Number(booking.dueAmount),
    travelStart: iso(booking.travelStartAt),
    travelEnd: iso(booking.travelEndAt),
  };
}

function between(date: Date, start: Date, end: Date) {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function serviceLabel(booking: Pick<BookingRecord, "modeOfJourney" | "packageName">) {
  const labels: Record<string, string> = { FLIGHT: "Air Ticket", TRAIN: "Railway Ticket", BUS: "Bus Ticket", HOTEL: "Hotel Booking", CAB: "Cab Service", OTHER: "Travel Service" };
  return (booking.modeOfJourney && labels[booking.modeOfJourney]) || booking.packageName || "Booking";
}

function groupBy(rows: ReportRow[], key: string) {
  const map = new Map<string, ReportRow[]>();
  for (const row of rows) {
    const group = String(row[key] ?? "");
    map.set(group, [...(map.get(group) ?? []), row]);
  }
  return map;
}

function sum(rows: ReportRow[], key: string) {
  return round(rows.reduce((total, row) => total + Number(row[key] ?? 0), 0));
}

function sumType(rows: ReportRow[], type: string) {
  return sum(rows.filter((row) => row.transactionType === type), "amount");
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function iso(value?: Date | null) {
  return value ? value.toISOString() : "";
}

function fromEnum(value: string) {
  return value.toLowerCase().replace(/(^|_)(\w)/g, (_match, _sep: string, char: string) => char.toUpperCase());
}

function textColumn(key: string, label: string): ReportColumn {
  return { key, label, type: "text" };
}
function dateColumn(key: string, label: string): ReportColumn {
  return { key, label, type: "date" };
}
function currencyColumn(key: string, label: string): ReportColumn {
  return { key, label, type: "currency", align: "right" };
}
function numberColumn(key: string, label: string): ReportColumn {
  return { key, label, type: "number", align: "right" };
}

function transactionColumns() {
  return [dateColumn("date", "Date"), textColumn("transactionType", "Type"), textColumn("refNo", "Ref No"), textColumn("customer", "Customer"), textColumn("bookingRef", "Booking Ref"), textColumn("productService", "Product/Service"), textColumn("description", "Description"), currencyColumn("amount", "Amount")];
}
function ledgerColumns() {
  return [textColumn("customer", "Customer"), dateColumn("date", "Date"), textColumn("transactionType", "Type"), textColumn("refNo", "Ref No"), textColumn("description", "Description"), currencyColumn("debit", "Debit"), currencyColumn("credit", "Credit"), currencyColumn("balance", "Balance")];
}
function paymentColumns() {
  return [dateColumn("paymentDate", "Payment Date"), textColumn("customer", "Customer"), textColumn("receiptRef", "Receipt"), textColumn("bookingRef", "Booking Ref"), textColumn("productService", "Product/Service"), textColumn("paymentMode", "Mode"), currencyColumn("amount", "Amount"), textColumn("direction", "Direction"), textColumn("notes", "Notes")];
}
function bookingColumns() {
  return [dateColumn("bookingDate", "Booking Date"), textColumn("bookingRef", "Booking Ref"), textColumn("customer", "Customer"), textColumn("vendor", "Vendor"), textColumn("productService", "Product/Service"), textColumn("status", "Status"), numberColumn("paxCount", "PAX"), currencyColumn("totalAmount", "Total"), currencyColumn("paidAmount", "Paid"), currencyColumn("dueAmount", "Due"), dateColumn("travelStart", "Travel Start"), dateColumn("travelEnd", "Travel End")];
}
function monthlyInvoiceColumns() {
  return [textColumn("month", "Month"), numberColumn("invoiceCount", "Invoices"), currencyColumn("invoiceTotal", "Invoice Total"), currencyColumn("paidTotal", "Paid"), currencyColumn("dueTotal", "Due")];
}
function serviceColumns() {
  return [textColumn("productService", "Product/Service"), numberColumn("bookingCount", "Bookings"), numberColumn("paxCount", "PAX"), currencyColumn("totalAmount", "Total"), currencyColumn("paidAmount", "Paid"), currencyColumn("dueAmount", "Due")];
}
function vendorLedgerColumns() {
  return [dateColumn("date", "Date"), textColumn("transactionType", "Type"), textColumn("refNo", "Ref No"), textColumn("vendor", "Vendor"), textColumn("paymentMode", "Mode"), currencyColumn("amount", "Amount"), currencyColumn("signedAmount", "Signed Amount"), currencyColumn("balance", "Balance"), textColumn("notes", "Notes")];
}
function monthlyIncomeColumns() {
  return [textColumn("month", "Month"), currencyColumn("invoiceTotal", "Invoiced"), currencyColumn("receivedTotal", "Received"), currencyColumn("expenseTotal", "Expenses"), currencyColumn("refundTotal", "Refunds"), currencyColumn("netCashflow", "Net Cashflow")];
}
function refundColumns() {
  return [dateColumn("date", "Date"), textColumn("direction", "Direction"), textColumn("refNo", "Ref No"), textColumn("party", "Party"), textColumn("paymentMode", "Mode"), currencyColumn("amount", "Amount"), textColumn("notes", "Notes")];
}
function gstColumns() {
  return [dateColumn("date", "Date"), textColumn("bookingRef", "Booking Ref"), textColumn("customer", "Customer"), currencyColumn("taxableValue", "Taxable Value"), currencyColumn("cgst", "CGST"), currencyColumn("sgst", "SGST"), currencyColumn("igst", "IGST"), currencyColumn("totalTax", "Total Tax"), currencyColumn("totalAmount", "Total Amount")];
}
function customerReportColumns() {
  return [dateColumn("bookingDate", "Booking Date"), textColumn("customer", "Customer"), textColumn("contact", "Contact"), textColumn("bookingRef", "Booking Ref"), textColumn("packageName", "Package"), textColumn("status", "Status"), currencyColumn("totalAmount", "Total"), currencyColumn("paidAmount", "Paid"), currencyColumn("dueAmount", "Due"), dateColumn("travelStart", "Travel Start")];
}
function vendorReportColumns() {
  return [dateColumn("paymentDate", "Payment Date"), textColumn("vendor", "Vendor"), textColumn("serviceType", "Service"), textColumn("receiptNo", "Receipt"), textColumn("category", "Category"), textColumn("paymentMode", "Mode"), currencyColumn("amount", "Amount"), textColumn("notes", "Notes")];
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
