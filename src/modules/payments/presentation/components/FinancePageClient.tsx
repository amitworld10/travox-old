"use client";

import { useMemo, useState, useTransition } from "react";
import { Banknote, HandCoins, Plus, RefreshCw, RotateCcw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AccountDto } from "@/modules/accounts/application/account-dto";
import type { BookingDto } from "@/modules/bookings/application/booking-dto";
import type { VendorDto } from "@/modules/vendors/application/vendor-dto";
import { Badge, PageHeader, StatCard, Table, TableBody, TableCell, TableHeader, TableRow } from "@/shared/presentation/components/server";
import { Button, Modal, Pagination, notify } from "@/shared/presentation/components/client";
import { paymentModes, type PaymentDto, type PaymentListDto, type PaymentModeLabel } from "../../application/payment-dto";
import {
  createExpensePaymentAction,
  createInboundRefundAction,
  createOutboundRefundAction,
  createReceivablePaymentAction,
  type PaymentActionResult,
} from "../actions/payment-actions";

type FinanceMode = "payments" | "expenses" | "refunds";

type Props = {
  mode: FinanceMode;
  initial: PaymentListDto;
  bookings: BookingDto[];
  vendors: VendorDto[];
  accounts: AccountDto[];
  receivables?: PaymentDto[];
  expenses?: PaymentDto[];
};

type FormState = {
  bookingId: string;
  vendorId: string;
  refundOfPaymentId: string;
  refundDirection: "outbound" | "inbound";
  amount: number;
  paymentMode: PaymentModeLabel;
  receiptNo: string;
  category: string;
  notes: string;
  fromAccountId: string;
};

const emptyForm: FormState = {
  bookingId: "",
  vendorId: "",
  refundOfPaymentId: "",
  refundDirection: "outbound",
  amount: 0,
  paymentMode: "CASH",
  receiptNo: "",
  category: "",
  notes: "",
  fromAccountId: "",
};

export function FinancePageClient({ accounts, bookings, expenses = [], initial, mode, receivables = [], vendors }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => seededForm(mode, bookings, vendors, receivables, expenses));

  const title = mode === "payments" ? "Receivable Payments" : mode === "expenses" ? "Expense Payments" : "Refunds";
  const description =
    mode === "payments"
      ? "Record customer receivables against bookings and update paid, due, and customer spend totals."
      : mode === "expenses"
        ? "Record vendor and operational expenses against linked vendor accounts."
        : "Process customer outbound refunds and vendor inbound refunds against original payments.";

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return initial.data.filter((payment) =>
      !term ||
      [
        payment.receiptNo,
        payment.bookingLabel,
        payment.customerName,
        payment.vendorName,
        payment.category,
        payment.notes,
        String(payment.amount),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [initial.data, query]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button disabled={isPending} icon={RefreshCw} onClick={() => router.refresh()} variant="outline">
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => openForm()}>
              {mode === "payments" ? "Record Payment" : mode === "expenses" ? "Record Expense" : "Process Refund"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard icon={Banknote} label="Receivables" value={formatMoney(initial.stats.receivableTotal)} tone="success" />
        <StatCard icon={HandCoins} label="Expenses" value={formatMoney(initial.stats.expenseTotal)} tone="warning" />
        <StatCard icon={RotateCcw} label="Customer Refunds" value={formatMoney(initial.stats.outboundRefundTotal)} />
        <StatCard label="Records" value={initial.count.toString()} />
      </div>

      <div className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            className={inputClass("pl-9")}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by receipt, booking, account party, category, notes, or amount"
            value={query}
          />
        </label>
        <Button variant="outline" onClick={() => setQuery("")}>
          Clear
        </Button>
      </div>

      {visible.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Receipt</TableCell>
                <TableCell header>Type</TableCell>
                <TableCell header>Party</TableCell>
                <TableCell header>Reference</TableCell>
                <TableCell header>Mode</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Date</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <strong>{payment.receiptNo || "No receipt"}</strong>
                    <br />
                    <span className="text-xs text-gray-500">{payment.category || payment.notes || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeVariant(payment.paymentType)}>{typeLabel(payment.paymentType)}</Badge>
                  </TableCell>
                  <TableCell>
                    {payment.customerName || payment.vendorName || "-"}
                    <br />
                    <span className="text-xs text-gray-500">{accountLabel(payment.fromAccount || payment.toAccount)}</span>
                  </TableCell>
                  <TableCell>
                    {payment.bookingLabel || (payment.refundOfPaymentId ? `Refund of ${payment.refundOfPaymentId.slice(0, 8)}` : "-")}
                    <br />
                    <span className="text-xs text-gray-500">{payment.refundableAmount > 0 ? `Refundable ${formatMoney(payment.refundableAmount)}` : payment.currency}</span>
                  </TableCell>
                  <TableCell>{modeLabel(payment.paymentMode)}</TableCell>
                  <TableCell className="font-semibold">{formatMoney(payment.amount)}</TableCell>
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination currentPage={page} itemsPerPage={pageSize} onItemsPerPageChange={setPageSize} onPageChange={setPage} totalItems={filtered.length} />
        </>
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-base font-semibold text-gray-950 dark:text-gray-100">No finance records found</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use the primary action above to create the first record for this workflow.</p>
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={mode === "payments" ? "Record Payment" : mode === "expenses" ? "Record Expense" : "Process Refund"} size="lg">
        <form className="space-y-4" onSubmit={submitForm}>
          {mode === "payments" ? <ReceivableFields bookings={bookings} form={form} setForm={setForm} /> : null}
          {mode === "expenses" ? <ExpenseFields accounts={accounts} vendors={vendors} form={form} setForm={setForm} /> : null}
          {mode === "refunds" ? <RefundFields expenses={expenses} form={form} receivables={receivables} setForm={setForm} /> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="Amount" required type="number" value={String(form.amount || "")} onChange={(amount) => setForm({ ...form, amount: Number(amount) })} />
            <Field label="Mode">
              <select className={inputClass()} value={form.paymentMode} onChange={(event) => setForm({ ...form, paymentMode: event.target.value as PaymentModeLabel })}>
                {paymentModes.map((paymentMode) => <option key={paymentMode} value={paymentMode}>{modeLabel(paymentMode)}</option>)}
              </select>
            </Field>
            <TextField label="Receipt No" value={form.receiptNo} onChange={(receiptNo) => setForm({ ...form, receiptNo })} />
            {mode === "expenses" ? <TextField label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} /> : null}
          </div>
          <Field label="Notes">
            <textarea className={`${inputClass()} min-h-24 py-2`} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">Cancel</Button>
            <Button loading={isPending} type="submit">{mode === "refunds" ? "Process Refund" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  function openForm() {
    setForm(seededForm(mode, bookings, vendors, receivables, expenses));
    setFormOpen(true);
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      let result: PaymentActionResult;
      if (mode === "payments") {
        result = await createReceivablePaymentAction({
          bookingId: form.bookingId,
          amount: form.amount,
          paymentMode: form.paymentMode,
          receiptNo: form.receiptNo,
          notes: form.notes,
        });
      } else if (mode === "expenses") {
        const vendor = vendors.find((item) => item.id === form.vendorId);
        result = await createExpensePaymentAction({
          toAccountId: vendor?.accountId || "",
          amount: form.amount,
          paymentMode: form.paymentMode,
          category: form.category,
          receiptNo: form.receiptNo,
          notes: form.notes,
          fromAccountId: form.fromAccountId,
        });
      } else if (form.refundDirection === "inbound") {
        result = await createInboundRefundAction({
          refundOfPaymentId: form.refundOfPaymentId,
          amount: form.amount,
          paymentMode: form.paymentMode,
          receiptNo: form.receiptNo,
          notes: form.notes,
        });
      } else {
        result = await createOutboundRefundAction({
          refundOfPaymentId: form.refundOfPaymentId,
          amount: form.amount,
          paymentMode: form.paymentMode,
          receiptNo: form.receiptNo,
          notes: form.notes,
        });
      }
      notify({ kind: result.ok ? "success" : "error", message: result.message });
      if (result.ok) {
        setFormOpen(false);
        router.refresh();
      }
    });
  }
}

function ReceivableFields({ bookings, form, setForm }: { bookings: BookingDto[]; form: FormState; setForm: (form: FormState) => void }) {
  const eligible = bookings.filter((booking) => booking.dueAmount > 0);
  const selected = eligible.find((booking) => booking.id === form.bookingId);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Booking">
        <select className={inputClass()} required value={form.bookingId} onChange={(event) => {
          const booking = eligible.find((item) => item.id === event.target.value);
          setForm({ ...form, bookingId: event.target.value, amount: booking?.dueAmount ?? form.amount });
        }}>
          {eligible.map((booking) => <option key={booking.id} value={booking.id}>{booking.packageName || booking.pnrNo || booking.id} - {booking.customerName}</option>)}
        </select>
      </Field>
      <ReadOnlyValue label="Due" value={selected ? formatMoney(selected.dueAmount) : "No due booking selected"} />
    </div>
  );
}

function ExpenseFields({ accounts, vendors, form, setForm }: { accounts: AccountDto[]; vendors: VendorDto[]; form: FormState; setForm: (form: FormState) => void }) {
  const linkedVendors = vendors.filter((vendor) => vendor.accountId);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Vendor">
        <select className={inputClass()} required value={form.vendorId} onChange={(event) => setForm({ ...form, vendorId: event.target.value })}>
          {linkedVendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name} - {accountLabel(vendor.account)}</option>)}
        </select>
      </Field>
      <Field label="Source Account">
        <select className={inputClass()} value={form.fromAccountId} onChange={(event) => setForm({ ...form, fromAccountId: event.target.value })}>
          <option value="">Not specified</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{accountLabel(account)}</option>)}
        </select>
      </Field>
    </div>
  );
}

function RefundFields({ expenses, form, receivables, setForm }: { expenses: PaymentDto[]; form: FormState; receivables: PaymentDto[]; setForm: (form: FormState) => void }) {
  const source = form.refundDirection === "outbound" ? receivables.filter((payment) => payment.refundableAmount > 0) : expenses.filter((payment) => payment.refundableAmount > 0);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Refund Type">
        <select className={inputClass()} value={form.refundDirection} onChange={(event) => {
          const refundDirection = event.target.value as FormState["refundDirection"];
          const nextSource = refundDirection === "outbound" ? receivables : expenses;
          const first = nextSource.find((payment) => payment.refundableAmount > 0);
          setForm({ ...form, refundDirection, refundOfPaymentId: first?.id ?? "", amount: first?.refundableAmount ?? 0 });
        }}>
          <option value="outbound">Customer outbound refund</option>
          <option value="inbound">Vendor inbound refund</option>
        </select>
      </Field>
      <Field label="Original Payment">
        <select className={inputClass()} required value={form.refundOfPaymentId} onChange={(event) => {
          const payment = source.find((item) => item.id === event.target.value);
          setForm({ ...form, refundOfPaymentId: event.target.value, amount: payment?.refundableAmount ?? form.amount });
        }}>
          {source.map((payment) => (
            <option key={payment.id} value={payment.id}>
              {(payment.customerName || payment.vendorName || payment.receiptNo || payment.id)} - {formatMoney(payment.refundableAmount)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">{label}{children}</label>;
}

function TextField({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value?: string }) {
  return <Field label={label}><input className={inputClass()} required={required} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950"><span className="text-xs font-medium uppercase text-gray-500">{label}</span><p className="text-sm font-semibold text-gray-950 dark:text-gray-100">{value}</p></div>;
}

function seededForm(mode: FinanceMode, bookings: BookingDto[], vendors: VendorDto[], receivables: PaymentDto[], expenses: PaymentDto[]): FormState {
  const form = { ...emptyForm };
  if (mode === "payments") {
    const booking = bookings.find((item) => item.dueAmount > 0);
    form.bookingId = booking?.id ?? "";
    form.amount = booking?.dueAmount ?? 0;
  }
  if (mode === "expenses") {
    form.vendorId = vendors.find((vendor) => vendor.accountId)?.id ?? "";
  }
  if (mode === "refunds") {
    const receivable = receivables.find((payment) => payment.refundableAmount > 0);
    form.refundOfPaymentId = receivable?.id ?? expenses.find((payment) => payment.refundableAmount > 0)?.id ?? "";
    form.refundDirection = receivable ? "outbound" : "inbound";
    form.amount = receivable?.refundableAmount ?? expenses.find((payment) => payment.refundableAmount > 0)?.refundableAmount ?? 0;
  }
  return form;
}

function typeLabel(type: PaymentDto["paymentType"]) {
  return type.replace("REFUND_", "Refund ").replace("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function typeVariant(type: PaymentDto["paymentType"]): "default" | "success" | "warning" | "info" {
  if (type === "RECEIVABLE") return "success";
  if (type === "EXPENSE") return "warning";
  if (type === "REFUND_INBOUND") return "info";
  return "default";
}

function modeLabel(mode: PaymentModeLabel) {
  return mode.replace("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function accountLabel(account?: AccountDto | null) {
  if (!account) return "-";
  return account.bankName || account.upiId || account.accountNo || account.id.slice(0, 8);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", maximumFractionDigits: 0, style: "currency" }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function inputClass(extra = "") {
  return `h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 ${extra}`;
}
