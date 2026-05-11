import type { ActorContext } from "@/shared/application/actor-context";

export type NavigationItem = {
  label: string;
  href: string;
  requiredPermission: string;
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: "Customers", href: "/customers", requiredPermission: "customers.read.any" },
  { label: "Vendors", href: "/vendors", requiredPermission: "vendors.read.any" },
  { label: "Bookings", href: "/bookings", requiredPermission: "bookings.read.any" },
  { label: "Payments", href: "/payments", requiredPermission: "payments.read.any" },
  { label: "Expenses", href: "/expenses", requiredPermission: "payments.expense.create.any" },
  { label: "Refunds", href: "/refunds", requiredPermission: "payments.refund.create.any" },
  { label: "Reports", href: "/reports", requiredPermission: "reports.read.any" },
  { label: "Logs", href: "/logs", requiredPermission: "audit_logs.read.any" },
  { label: "Users", href: "/users", requiredPermission: "users.read.any" },
];

export function getNavigationForActor(actor: ActorContext): NavigationItem[] {
  return NAVIGATION_ITEMS.filter((item) =>
    actor.permissions.includes(item.requiredPermission),
  );
}
