"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard, FileText, Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import type { AccountDto } from "@/modules/accounts/application/account-dto";
import type { CustomerDto, CustomerListDto } from "@/modules/customers/application/customer-dto";
import { serviceTypeLabels, type ServiceTypeLabel, type VendorDto, type VendorListDto } from "@/modules/vendors/application/vendor-dto";
import { Badge, PageHeader, StatCard, Table, TableBody, TableCell, TableHeader, TableRow } from "@/shared/presentation/components/server";
import { Button, Modal, Pagination, notify } from "@/shared/presentation/components/client";
import {
  deleteCustomerAction,
  deleteVendorAction,
  saveAccountForCustomerAction,
  saveAccountForVendorAction,
  saveCustomerAction,
  saveVendorAction,
  type MasterDataActionResult,
} from "../actions/master-data-actions";

type Mode = "customers" | "vendors";

type Props =
  | {
      mode: "customers";
      initial: CustomerListDto;
    }
  | {
      mode: "vendors";
      initial: VendorListDto;
    };

const emptyAccount = {
  bankName: "",
  ifscCode: "",
  branchName: "",
  accountNo: "",
  upiId: "",
};

type AccountForm = typeof emptyAccount;
type CustomerForm = Pick<CustomerDto, "name" | "phone" | "email" | "passportNo" | "aadhaarNo" | "visaNo" | "gstin" | "accountId">;
type VendorForm = Pick<VendorDto, "name" | "serviceType" | "pocName" | "phone" | "email" | "gstin" | "accountId">;

export function MasterDataPageClient(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(null);
  const [editingVendor, setEditingVendor] = useState<VendorDto | null>(null);
  const [accountTarget, setAccountTarget] = useState<CustomerDto | VendorDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerDto | VendorDto | null>(null);

  const isCustomers = props.mode === "customers";
  const items: Array<CustomerDto | VendorDto> = props.initial.data;
  const filtered = useMemo(() => filterItems(items, query), [items, query]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const linkedAccounts = props.initial.stats.linkedAccounts;

  const title = isCustomers ? "Customer Management" : "Vendor Management";
  const description = isCustomers
    ? "Manage customer records, sensitive identity fields, account links, and booking history from the migrated Next module."
    : "Manage service providers, contacts, payout account links, and vendor report entry points from the migrated Next module.";

  const onDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = isCustomers ? await deleteCustomerAction(deleteTarget.id) : await deleteVendorAction(deleteTarget.id);
      finish(result);
      if (result.ok) setDeleteTarget(null);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" icon={FileText} onClick={() => router.push(isCustomers ? "/customers/report" : "/vendors/report")}>
              Report
            </Button>
            <Button variant="outline" icon={RefreshCw} onClick={() => router.refresh()} disabled={isPending}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => (isCustomers ? setEditingCustomer(newCustomer()) : setEditingVendor(newVendor()))}>
              {isCustomers ? "Create Customer" : "Create Vendor"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard icon={isCustomers ? Users : Building2} label={query ? "Search Results" : isCustomers ? "Total Customers" : "Total Vendors"} value={filtered.length.toString()} tone="primary" />
        <StatCard icon={CreditCard} label="Linked Accounts" value={linkedAccounts.toString()} />
        <StatCard
          label={isCustomers ? "Customer Spend" : "Vendor Expense"}
          value={formatMoney(isCustomers ? props.initial.stats.totalSpent : props.initial.stats.totalExpense)}
          tone="success"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={isCustomers ? "Search by name, phone, email, passport, or GSTIN" : "Search by name, service type, contact, phone, or GSTIN"}
            value={query}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{props.initial.count} records loaded</p>
      </div>

      {visible.length > 0 ? (
        <>
          {isCustomers ? (
            <CustomerTable customers={visible as CustomerDto[]} onAccount={setAccountTarget} onDelete={setDeleteTarget} onEdit={setEditingCustomer} />
          ) : (
            <VendorTable vendors={visible as VendorDto[]} onAccount={setAccountTarget} onDelete={setDeleteTarget} onEdit={setEditingVendor} />
          )}
          <Pagination currentPage={page} totalItems={filtered.length} itemsPerPage={pageSize} onPageChange={setPage} onItemsPerPageChange={setPageSize} />
        </>
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-base font-semibold text-gray-950 dark:text-gray-100">{query ? "No matching records" : isCustomers ? "No customers yet" : "No vendors yet"}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{query ? "Clear the search or try a different keyword." : "Create the first record to start building master data."}</p>
        </div>
      )}

      <CustomerFormModal key={`customer-${editingCustomer?.id ?? "closed"}`} customer={editingCustomer} isPending={isPending} onClose={() => setEditingCustomer(null)} onSaved={finish} startTransition={startTransition} />
      <VendorFormModal key={`vendor-${editingVendor?.id ?? "closed"}`} isPending={isPending} onClose={() => setEditingVendor(null)} onSaved={finish} startTransition={startTransition} vendor={editingVendor} />
      <AccountModal key={`account-${accountTarget?.id ?? "closed"}`} isPending={isPending} mode={props.mode} onClose={() => setAccountTarget(null)} onSaved={finish} startTransition={startTransition} target={accountTarget} />

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={isCustomers ? "Delete Customer" : "Delete Vendor"} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This will soft-delete <strong>{deleteTarget?.name}</strong> and hide it from active workflows.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" icon={Trash2} loading={isPending} onClick={onDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  function finish(result: MasterDataActionResult) {
    notify({ kind: result.ok ? "success" : "error", message: result.message ?? (result.ok ? "Saved." : "Request failed.") });
    if (result.ok) {
      setEditingCustomer(null);
      setEditingVendor(null);
      setAccountTarget(null);
      router.refresh();
    }
  }
}

function CustomerTable({ customers, onAccount, onDelete, onEdit }: { customers: CustomerDto[]; onAccount: (customer: CustomerDto) => void; onDelete: (customer: CustomerDto) => void; onEdit: (customer: CustomerDto) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell header>Name</TableCell>
          <TableCell header>Contact</TableCell>
          <TableCell header>Identity</TableCell>
          <TableCell header>Totals</TableCell>
          <TableCell header>Account</TableCell>
          <TableCell header className="text-right">Actions</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell><strong>{customer.name}</strong></TableCell>
            <TableCell>{customer.email || "No email"}<br /><span className="text-xs text-gray-500">{customer.phone || "No phone"}</span></TableCell>
            <TableCell>{customer.passportNo || "No passport"}<br /><span className="text-xs text-gray-500">{customer.gstin || "No GSTIN"}</span></TableCell>
            <TableCell>{formatMoney(customer.totalSpent)}<br /><span className="text-xs text-gray-500">{customer.totalBookings} bookings</span></TableCell>
            <TableCell><Badge variant={customer.accountId ? "success" : "default"}>{customer.accountId ? "Linked" : "Not linked"}</Badge></TableCell>
            <TableCell className="text-right"><RowActions onAccount={() => onAccount(customer)} onDelete={() => onDelete(customer)} onEdit={() => onEdit(customer)} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function VendorTable({ vendors, onAccount, onDelete, onEdit }: { vendors: VendorDto[]; onAccount: (vendor: VendorDto) => void; onDelete: (vendor: VendorDto) => void; onEdit: (vendor: VendorDto) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell header>Name</TableCell>
          <TableCell header>Service</TableCell>
          <TableCell header>Contact</TableCell>
          <TableCell header>Totals</TableCell>
          <TableCell header>Account</TableCell>
          <TableCell header className="text-right">Actions</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell><strong>{vendor.name}</strong><br /><span className="text-xs text-gray-500">{vendor.gstin || "No GSTIN"}</span></TableCell>
            <TableCell><Badge>{vendor.serviceType}</Badge></TableCell>
            <TableCell>{vendor.email}<br /><span className="text-xs text-gray-500">{vendor.phone} {vendor.pocName ? `- ${vendor.pocName}` : ""}</span></TableCell>
            <TableCell>{formatMoney(vendor.totalExpense)}<br /><span className="text-xs text-gray-500">{vendor.totalBookings} bookings</span></TableCell>
            <TableCell><Badge variant={vendor.accountId ? "success" : "default"}>{vendor.accountId ? "Linked" : "Not linked"}</Badge></TableCell>
            <TableCell className="text-right"><RowActions onAccount={() => onAccount(vendor)} onDelete={() => onDelete(vendor)} onEdit={() => onEdit(vendor)} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RowActions({ onAccount, onDelete, onEdit }: { onAccount: () => void; onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button aria-label="Edit" icon={Pencil} size="icon" variant="outline" onClick={onEdit} />
      <Button aria-label="Account" icon={CreditCard} size="icon" variant="outline" onClick={onAccount} />
      <Button aria-label="Delete" icon={Trash2} size="icon" variant="danger" onClick={onDelete} />
    </div>
  );
}

function CustomerFormModal({ customer, isPending, onClose, onSaved, startTransition }: { customer: CustomerDto | null; isPending: boolean; onClose: () => void; onSaved: (result: MasterDataActionResult) => void; startTransition: (callback: () => void) => void }) {
  const [form, setForm] = useState<CustomerForm>(() => customer ?? newCustomer());
  if (!customer) return null;
  return (
    <Modal isOpen onClose={onClose} title={customer.id ? "Edit Customer" : "Create Customer"} size="lg">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); startTransition(async () => onSaved(await saveCustomerAction(form, customer.id || undefined))); }}>
        <FormGrid>
          <TextField label="Full Name" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <TextField label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
          <TextField label="Passport Number" value={form.passportNo} onChange={(passportNo) => setForm({ ...form, passportNo: passportNo.toUpperCase().slice(0, 8) })} />
          <TextField label="Aadhaar Number" value={form.aadhaarNo} onChange={(aadhaarNo) => setForm({ ...form, aadhaarNo: aadhaarNo.replace(/\D/g, "").slice(0, 12) })} />
          <TextField label="GSTIN" value={form.gstin} onChange={(gstin) => setForm({ ...form, gstin: gstin.toUpperCase().slice(0, 15) })} />
          <TextField label="Visa Number" value={form.visaNo} onChange={(visaNo) => setForm({ ...form, visaNo })} />
        </FormGrid>
        <FormFooter isPending={isPending} onClose={onClose} submitLabel={customer.id ? "Update Customer" : "Create Customer"} />
      </form>
    </Modal>
  );
}

function VendorFormModal({ isPending, onClose, onSaved, startTransition, vendor }: { isPending: boolean; onClose: () => void; onSaved: (result: MasterDataActionResult) => void; startTransition: (callback: () => void) => void; vendor: VendorDto | null }) {
  const [form, setForm] = useState<VendorForm>(() => vendor ?? newVendor());
  if (!vendor) return null;
  return (
    <Modal isOpen onClose={onClose} title={vendor.id ? "Edit Vendor" : "Create Vendor"} size="lg">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); startTransition(async () => onSaved(await saveVendorAction(form, vendor.id || undefined))); }}>
        <FormGrid>
          <TextField label="Vendor Name" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">Service Type<select className={inputClass} required value={form.serviceType} onChange={(event) => setForm({ ...form, serviceType: event.target.value as ServiceTypeLabel })}>{serviceTypeLabels.map((type) => <option key={type}>{type}</option>)}</select></label>
          <TextField label="Contact Person" value={form.pocName} onChange={(pocName) => setForm({ ...form, pocName })} />
          <TextField label="Email" required type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <TextField label="Phone" required value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
          <TextField label="GSTIN" value={form.gstin} onChange={(gstin) => setForm({ ...form, gstin: gstin.toUpperCase().slice(0, 15) })} />
        </FormGrid>
        <FormFooter isPending={isPending} onClose={onClose} submitLabel={vendor.id ? "Update Vendor" : "Create Vendor"} />
      </form>
    </Modal>
  );
}

function AccountModal({ isPending, mode, onClose, onSaved, startTransition, target }: { isPending: boolean; mode: Mode; onClose: () => void; onSaved: (result: MasterDataActionResult) => void; startTransition: (callback: () => void) => void; target: CustomerDto | VendorDto | null }) {
  const [form, setForm] = useState<AccountForm>(() => target?.account ?? emptyAccount);
  if (!target) return null;
  const account = target.account as AccountDto | null;
  return (
    <Modal isOpen onClose={onClose} title={account ? "Edit Linked Account" : "Link Account"} size="md">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); startTransition(async () => onSaved(mode === "customers" ? await saveAccountForCustomerAction(target.id, form, account?.id) : await saveAccountForVendorAction(target.id, form, account?.id))); }}>
        <div className="space-y-3">
          <TextField label="Bank Name" value={form.bankName} onChange={(bankName) => setForm({ ...form, bankName })} />
          <TextField label="Account Number" value={form.accountNo} onChange={(accountNo) => setForm({ ...form, accountNo: accountNo.replace(/\D/g, "") })} />
          <TextField label="IFSC Code" value={form.ifscCode} onChange={(ifscCode) => setForm({ ...form, ifscCode: ifscCode.toUpperCase() })} />
          <TextField label="Branch Name" value={form.branchName} onChange={(branchName) => setForm({ ...form, branchName })} />
          <TextField label="UPI ID" value={form.upiId} onChange={(upiId) => setForm({ ...form, upiId })} />
        </div>
        <p className="text-xs text-gray-500">Provide either UPI ID or both account number and IFSC code.</p>
        <FormFooter isPending={isPending} onClose={onClose} submitLabel={account ? "Update Account" : "Link Account"} />
      </form>
    </Modal>
  );
}

function TextField({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value?: string }) {
  return <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">{label}<input className={inputClass} required={required} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

function FormFooter({ isPending, onClose, submitLabel }: { isPending: boolean; onClose: () => void; submitLabel: string }) {
  return <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button loading={isPending} type="submit">{submitLabel}</Button></div>;
}

function filterItems<T extends CustomerDto | VendorDto>(items: T[], query: string): T[] {
  const term = query.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) => Object.values(item).some((value) => typeof value === "string" && value.toLowerCase().includes(term)));
}

function newCustomer(): CustomerDto {
  return { id: "", orgId: "", name: "", phone: "", email: "", passportNo: "", aadhaarNo: "", visaNo: "", gstin: "", accountId: "", account: null, totalBookings: 0, totalSpent: 0, createdAt: "", updatedAt: "" };
}

function newVendor(): VendorDto {
  return { id: "", orgId: "", name: "", serviceType: "Airline", pocName: "", phone: "", email: "", gstin: "", accountId: "", account: null, totalExpense: 0, totalBookings: 0, createdAt: "", updatedAt: "" };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", maximumFractionDigits: 0, style: "currency" }).format(value);
}

const inputClass = "mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";
