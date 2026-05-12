import Link from "next/link";
import type { CustomerDto } from "@/modules/customers/application/customer-dto";
import type { VendorDto } from "@/modules/vendors/application/vendor-dto";
import type { ReportFilters, ReportUiConfig } from "../../application/report-dto";

type Props = {
  actionPath: string;
  filters: ReportFilters;
  config?: ReportUiConfig;
  customers?: CustomerDto[];
  vendors?: VendorDto[];
};

export function ReportFilters({ actionPath, config, customers = [], filters, vendors = [] }: Props) {
  return (
    <form action={actionPath} className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-4">
      <Field label="Start Date"><input className={inputClass()} name="startDate" type="date" defaultValue={dateInput(filters.startDate)} /></Field>
      <Field label="End Date"><input className={inputClass()} name="endDate" type="date" defaultValue={dateInput(filters.endDate)} /></Field>
      {config?.supportsCustomerFilter ? (
        <Field label="Customer">
          <select className={inputClass()} name="customerIds" defaultValue={filters.customerIds[0] ?? ""}>
            <option value="">All customers</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </Field>
      ) : null}
      {config?.supportsVendorFilter ? (
        <Field label="Vendor">
          <select className={inputClass()} name="vendorIds" defaultValue={filters.vendorIds[0] ?? ""}>
            <option value="">All vendors</option>
            {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
          </select>
        </Field>
      ) : null}
      {config?.supportsPaymentModeFilter ? (
        <Field label="Payment Mode">
          <select className={inputClass()} name="paymentModes" defaultValue={filters.paymentModes[0] ?? ""}>
            <option value="">All modes</option>
            {["CASH", "CARD", "UPI", "NETBANKING", "BANK_TRANSFER", "CHEQUE", "WALLET", "OTHER"].map((mode) => <option key={mode} value={mode}>{mode.replace("_", " ")}</option>)}
          </select>
        </Field>
      ) : null}
      {config?.supportsTransactionTypeFilter ? (
        <Field label="Transaction Type">
          <select className={inputClass()} name="transactionTypes" defaultValue={filters.transactionTypes[0] ?? ""}>
            <option value="">All types</option>
            <option value="INVOICE">Invoice</option>
            <option value="PAYMENT">Payment</option>
            <option value="CREDIT_MEMO">Credit Memo</option>
          </select>
        </Field>
      ) : null}
      <Field label="Search"><input className={inputClass()} name="search" defaultValue={filters.search} placeholder="Search report rows" /></Field>
      <div className="flex flex-wrap items-end gap-3 lg:col-span-4">
        {config?.supportsPendingOnly ? <Check name="pendingOnly" label="Pending only" checked={filters.pendingOnly} /> : null}
        {config?.supportsIncludeRefunds ? <Check name="includeRefunds" label="Include refunds" checked={filters.includeRefunds} /> : null}
        {config?.supportsIncludePaymentDetails ? <Check name="includePaymentDetails" label="Include payment details" checked={filters.includePaymentDetails} /> : null}
        {config?.supportsIncludeZeroBalance ? <Check name="includeZeroBalance" label="Include zero balance" checked={filters.includeZeroBalance} /> : null}
        <button className="h-10 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white" type="submit">Apply Filters</button>
        <Link className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" href={actionPath}>Reset</Link>
      </div>
    </form>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">{label}{children}</label>;
}

function Check({ checked, label, name }: { checked: boolean; label: string; name: string }) {
  return <label className="flex h-10 items-center gap-2 text-sm text-gray-700 dark:text-gray-200"><input className="h-4 w-4" defaultChecked={checked} name={name} type="checkbox" />{label}</label>;
}

function dateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function inputClass() {
  return "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";
}
