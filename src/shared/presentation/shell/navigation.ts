import type { ActorContext } from "@/shared/application/actor-context";

export type ShellNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  requiredPermission: string;
};

export type ShellNavGroup = {
  title: string;
  items: ShellNavItem[];
};

export const SHELL_NAV_GROUPS: ShellNavGroup[] = [
  {
    title: "Operations",
    items: [
      { id: "customers", label: "Customers", href: "/customers", icon: "Users", requiredPermission: "customers.read.any" },
      { id: "vendors", label: "Vendors", href: "/vendors", icon: "Building2", requiredPermission: "vendors.read.any" },
      { id: "bookings", label: "Bookings", href: "/bookings", icon: "Calendar", requiredPermission: "bookings.read.any" },
    ],
  },
  {
    title: "Finance",
    items: [
      { id: "payments", label: "Payments", href: "/payments", icon: "CreditCard", requiredPermission: "payments.read.any" },
      { id: "expenses", label: "Expenses", href: "/expenses", icon: "Receipt", requiredPermission: "payments.expense.create.any" },
      { id: "refunds", label: "Refunds", href: "/refunds", icon: "RefreshCw", requiredPermission: "payments.refund.create.any" },
    ],
  },
  {
    title: "Reporting",
    items: [
      { id: "reports", label: "Reporting Center", href: "/reports", icon: "FileText", requiredPermission: "reports.read.any" },
      { id: "customers-report", label: "Customer Report", href: "/customers/report", icon: "FileText", requiredPermission: "customers.read.any" },
      { id: "vendors-report", label: "Vendor Report", href: "/vendors/report", icon: "FileText", requiredPermission: "vendors.read.any" },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: "logs", label: "Audit Logs", href: "/logs", icon: "Clock", requiredPermission: "audit_logs.read.any" },
      { id: "users", label: "User Access", href: "/users", icon: "Shield", requiredPermission: "users.read.any" },
    ],
  },
];

export function getShellNavigationForActor(actor: ActorContext): ShellNavGroup[] {
  return SHELL_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => actor.permissions.includes(item.requiredPermission)),
  })).filter((group) => group.items.length > 0);
}

export const routeLabels: Record<string, string> = {
  customers: "Customers",
  vendors: "Vendors",
  bookings: "Bookings",
  payments: "Payments",
  expenses: "Expenses",
  refunds: "Refunds",
  reports: "Reporting Center",
  logs: "Audit Logs",
  users: "User Access",
  legacy: "Legacy",
};

export const quickActionsByRoute: Record<string, Array<{ id: string; label: string; href: string }>> = {
  "/customers": [
    { id: "customer.create", label: "New Customer", href: "/customers" },
    { id: "customer.report", label: "Customer Report", href: "/customers/report" },
  ],
  "/vendors": [
    { id: "vendor.create", label: "New Vendor", href: "/vendors" },
    { id: "vendor.report", label: "Vendor Report", href: "/vendors/report" },
  ],
  "/bookings": [
    { id: "booking.create", label: "New Booking", href: "/bookings" },
    { id: "customer.create", label: "New Customer", href: "/customers" },
  ],
  "/payments": [
    { id: "payment.create", label: "Record Payment", href: "/payments" },
    { id: "expense.create", label: "Record Expense", href: "/expenses" },
    { id: "refund.create", label: "Create Refund", href: "/refunds" },
  ],
  "/expenses": [
    { id: "expense.create", label: "Record Expense", href: "/expenses" },
    { id: "payment.create", label: "Record Payment", href: "/payments" },
  ],
  "/refunds": [
    { id: "refund.create", label: "Create Refund", href: "/refunds" },
    { id: "payment.create", label: "Record Payment", href: "/payments" },
  ],
  "/reports": [
    { id: "report.center", label: "Reporting Center", href: "/reports" },
    { id: "customer.report", label: "Customer Report", href: "/customers/report" },
    { id: "vendor.report", label: "Vendor Report", href: "/vendors/report" },
  ],
};
