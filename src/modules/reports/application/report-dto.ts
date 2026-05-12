export const reportIds = [
  "sales-by-customer-detail",
  "customer-balance-detail",
  "customer-payment-details",
  "payment-details-by-customer",
  "customer-ledger",
  "invoice-credit-note-list-by-date",
  "invoice-list",
  "invoices-by-month",
  "sales-by-product-service-detail",
  "transaction-list-by-customer",
  "transaction-list-by-date",
  "payment-splits-by-customer",
  "vendor-ledger",
  "outstanding-payments",
  "monthly-income-expense",
  "refund-register",
  "booking-register",
  "gst-view",
] as const;

export type ReportId = (typeof reportIds)[number];
export type ReportCategory = "Sales" | "Customers" | "Vendors" | "Transactions" | "Refunds" | "Existing";
export type ReportColumnType = "text" | "date" | "currency" | "number" | "badge";
export type ReportCell = string | number | boolean | null;
export type ReportRow = Record<string, ReportCell>;

export type ReportCatalogItem = {
  id: string;
  label: string;
  description: string;
  category: ReportCategory;
  route: string;
  endpoint?: string;
  existing?: boolean;
  experimental?: boolean;
};

export type ReportColumn = {
  key: string;
  label: string;
  type: ReportColumnType;
  align?: "left" | "right" | "center";
};

export type ReportMeta = {
  reportId: string;
  title: string;
  generatedAt: string;
  interval: {
    start: string;
    end: string;
  };
  totals: Record<string, number>;
  notes?: string[];
};

export type ReportResultDto = {
  data: ReportRow[];
  count: number;
  columns: ReportColumn[];
  meta: ReportMeta;
};

export type ReportFilters = {
  startDate: Date;
  endDate: Date;
  customerIds: string[];
  vendorIds: string[];
  transactionTypes: string[];
  paymentModes: string[];
  serviceTypes: string[];
  pendingOnly: boolean;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  includeRefunds: boolean;
  includePaymentDetails: boolean;
  includeZeroBalance: boolean;
  bookingId: string;
};

export type ReportUiConfig = {
  id: string;
  supportsCustomerFilter?: boolean;
  supportsVendorFilter?: boolean;
  supportsTransactionTypeFilter?: boolean;
  supportsPaymentModeFilter?: boolean;
  supportsServiceTypeFilter?: boolean;
  supportsPendingOnly?: boolean;
  supportsIncludeRefunds?: boolean;
  supportsIncludePaymentDetails?: boolean;
  supportsIncludeZeroBalance?: boolean;
};
