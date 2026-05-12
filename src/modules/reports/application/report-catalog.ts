import type { ReportCatalogItem, ReportUiConfig } from "./report-dto";

export const reportCatalog: ReportCatalogItem[] = [
  { id: "sales-by-customer-detail", label: "Sales by Customer Detail", description: "Invoice-like bookings, customer payments, and credit memo rows grouped by customer.", category: "Sales", route: "/reports/sales-by-customer-detail", endpoint: "/api/reports/sales-by-customer-detail" },
  { id: "customer-balance-detail", label: "Customer Balance Detail", description: "Chronological debit/credit movement and running customer balance.", category: "Customers", route: "/reports/customer-balance-detail", endpoint: "/api/reports/customer-balance-detail" },
  { id: "customer-payment-details", label: "Customer Payment Details", description: "Customer-side payment register with receipt references and booking linkage.", category: "Customers", route: "/reports/customer-payment-details", endpoint: "/api/reports/customer-payment-details" },
  { id: "payment-details-by-customer", label: "Payment Details by Customer", description: "Alternate customer payment-detail view using the same receivable/refund transaction truth.", category: "Customers", route: "/reports/payment-details-by-customer", endpoint: "/api/reports/payment-details-by-customer" },
  { id: "customer-ledger", label: "Customer Ledger", description: "Opening, in-period entries, and closing balance statement for customers.", category: "Customers", route: "/reports/customer-ledger", endpoint: "/api/reports/customer-ledger" },
  { id: "invoice-credit-note-list-by-date", label: "Invoice And Credit Note List by Date", description: "Date-ordered invoice-like booking rows and credit memo entries.", category: "Sales", route: "/reports/invoice-credit-note-list-by-date", endpoint: "/api/reports/invoice-credit-note-list-by-date" },
  { id: "invoice-list", label: "Invoice List", description: "Flat invoice-style list from bookings with paid and due amounts.", category: "Sales", route: "/reports/invoice-list", endpoint: "/api/reports/invoice-list" },
  { id: "invoices-by-month", label: "Invoices by Month", description: "Monthly aggregated booking invoice value with paid and due totals.", category: "Sales", route: "/reports/invoices-by-month", endpoint: "/api/reports/invoices-by-month" },
  { id: "sales-by-product-service-detail", label: "Sales by Product/Service Detail", description: "Booking sales detail grouped by derived service labels.", category: "Sales", route: "/reports/sales-by-product-service-detail", endpoint: "/api/reports/sales-by-product-service-detail" },
  { id: "transaction-list-by-customer", label: "Transaction List by Customer", description: "Dense customer-wise transaction timeline across invoices, payments, and credits.", category: "Transactions", route: "/reports/transaction-list-by-customer", endpoint: "/api/reports/transaction-list-by-customer" },
  { id: "transaction-list-by-date", label: "Transaction List by Date", description: "Chronological register of customer-facing transactions.", category: "Transactions", route: "/reports/transaction-list-by-date", endpoint: "/api/reports/transaction-list-by-date" },
  { id: "payment-splits-by-customer", label: "Transaction List with Splits for Customer Payment Details", description: "Truthful one-payment-to-one-booking split rows, future-ready for split allocations.", category: "Transactions", route: "/reports/payment-splits-by-customer", endpoint: "/api/reports/payment-splits-by-customer" },
  { id: "vendor-ledger", label: "Vendor Ledger", description: "Vendor expense and inbound refund running balance report.", category: "Vendors", route: "/reports/vendor-ledger", endpoint: "/api/reports/vendor-ledger" },
  { id: "outstanding-payments", label: "Outstanding Payments", description: "Booking due amount register for pending receivables.", category: "Transactions", route: "/reports/outstanding-payments", endpoint: "/api/reports/outstanding-payments" },
  { id: "monthly-income-expense", label: "Monthly Income vs Expense", description: "Month-wise summary of invoiced, received, expense, and refund values.", category: "Transactions", route: "/reports/monthly-income-expense", endpoint: "/api/reports/monthly-income-expense" },
  { id: "refund-register", label: "Refund Register", description: "Outbound and inbound refund register with direction markers.", category: "Refunds", route: "/reports/refund-register", endpoint: "/api/reports/refund-register" },
  { id: "booking-register", label: "Booking Register", description: "Booking-centric commercial register with status and due context.", category: "Transactions", route: "/reports/booking-register", endpoint: "/api/reports/booking-register" },
  { id: "gst-view", label: "GST / Tax View (Derived)", description: "Derived tax-oriented snapshot with explicit schema limitations.", category: "Transactions", route: "/reports/gst-view", endpoint: "/api/reports/gst-view", experimental: true },
  { id: "customer-report-existing", label: "Customer Report", description: "Customer booking and payment report retained as a first-class page.", category: "Existing", route: "/customers/report", existing: true },
  { id: "vendor-report-existing", label: "Vendor Report", description: "Vendor expense report retained as a first-class page.", category: "Existing", route: "/vendors/report", existing: true },
];

export const reportUiConfig: ReportUiConfig[] = [
  { id: "sales-by-customer-detail", supportsCustomerFilter: true, supportsTransactionTypeFilter: true, supportsServiceTypeFilter: true, supportsPendingOnly: true, supportsIncludeRefunds: true, supportsIncludePaymentDetails: true },
  { id: "customer-balance-detail", supportsCustomerFilter: true, supportsTransactionTypeFilter: true, supportsIncludeZeroBalance: true },
  { id: "customer-payment-details", supportsCustomerFilter: true, supportsPaymentModeFilter: true, supportsIncludeRefunds: true },
  { id: "payment-details-by-customer", supportsCustomerFilter: true, supportsPaymentModeFilter: true, supportsIncludeRefunds: true },
  { id: "customer-ledger", supportsCustomerFilter: true, supportsIncludeZeroBalance: true },
  { id: "invoice-credit-note-list-by-date", supportsCustomerFilter: true, supportsIncludeRefunds: true },
  { id: "invoice-list", supportsCustomerFilter: true, supportsServiceTypeFilter: true, supportsPendingOnly: true },
  { id: "invoices-by-month", supportsCustomerFilter: true, supportsServiceTypeFilter: true },
  { id: "sales-by-product-service-detail", supportsCustomerFilter: true, supportsServiceTypeFilter: true, supportsIncludeRefunds: true },
  { id: "transaction-list-by-customer", supportsCustomerFilter: true, supportsTransactionTypeFilter: true, supportsPendingOnly: true, supportsIncludeRefunds: true },
  { id: "transaction-list-by-date", supportsCustomerFilter: true, supportsTransactionTypeFilter: true, supportsIncludeRefunds: true },
  { id: "payment-splits-by-customer", supportsCustomerFilter: true, supportsPaymentModeFilter: true },
  { id: "vendor-ledger", supportsVendorFilter: true, supportsPaymentModeFilter: true, supportsIncludeZeroBalance: true },
  { id: "outstanding-payments", supportsCustomerFilter: true, supportsPendingOnly: true },
  { id: "monthly-income-expense" },
  { id: "refund-register", supportsPaymentModeFilter: true },
  { id: "booking-register", supportsCustomerFilter: true, supportsVendorFilter: true, supportsServiceTypeFilter: true, supportsPendingOnly: true },
  { id: "gst-view", supportsCustomerFilter: true },
];

export function getReportCatalog() {
  return reportCatalog;
}

export function getReportCatalogItem(id: string) {
  return reportCatalog.find((item) => item.id === id);
}

export function getReportUiConfig(id: string): ReportUiConfig {
  return reportUiConfig.find((item) => item.id === id) ?? { id };
}
