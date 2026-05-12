import type { AccountDto } from "@/modules/accounts/application/account-dto";

export const paymentTypes = ["RECEIVABLE", "EXPENSE", "REFUND_INBOUND", "REFUND_OUTBOUND"] as const;
export type PaymentTypeLabel = (typeof paymentTypes)[number];

export const paymentModes = ["CASH", "CARD", "UPI", "NETBANKING", "BANK_TRANSFER", "CHEQUE", "WALLET", "OTHER"] as const;
export type PaymentModeLabel = (typeof paymentModes)[number];

export type PaymentDto = {
  id: string;
  orgId: string;
  paymentType: PaymentTypeLabel;
  amount: number;
  currency: string;
  paymentMode: PaymentModeLabel;
  bookingId: string;
  bookingLabel: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  refundOfPaymentId: string;
  category: string;
  notes: string;
  receiptNo: string;
  fromAccountId: string;
  fromAccount: AccountDto | null;
  toAccountId: string;
  toAccount: AccountDto | null;
  refundableAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentStatsDto = {
  receivableTotal: number;
  expenseTotal: number;
  inboundRefundTotal: number;
  outboundRefundTotal: number;
  count: number;
};

export type PaymentListDto = {
  data: PaymentDto[];
  count: number;
  stats: PaymentStatsDto;
};

export type PaymentFilterInput = {
  type?: PaymentTypeLabel;
  q?: string;
  limit?: number;
  offset?: number;
};

export type ReceivablePaymentInput = {
  bookingId: string;
  amount: number;
  paymentMode: PaymentModeLabel;
  receiptNo?: string;
  notes?: string;
  fromAccountId?: string;
};

export type ExpensePaymentInput = {
  toAccountId: string;
  amount: number;
  paymentMode: PaymentModeLabel;
  category?: string;
  receiptNo?: string;
  notes?: string;
  fromAccountId?: string;
};

export type RefundPaymentInput = {
  refundOfPaymentId: string;
  amount?: number;
  paymentMode: PaymentModeLabel;
  receiptNo?: string;
  notes?: string;
};
