import { z } from "zod";
import { paymentModes, paymentTypes } from "../../application/payment-dto";

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const positiveMoney = z.coerce.number().positive("Amount must be greater than 0.");

export const paymentFilterSchema = z.object({
  type: z.enum(paymentTypes).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const receivablePaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking is required."),
  amount: positiveMoney,
  paymentMode: z.enum(paymentModes),
  receiptNo: optionalText,
  notes: optionalText,
  fromAccountId: optionalText,
});

export const expensePaymentSchema = z.object({
  toAccountId: z.string().min(1, "Destination account is required."),
  amount: positiveMoney,
  paymentMode: z.enum(paymentModes),
  category: optionalText,
  receiptNo: optionalText,
  notes: optionalText,
  fromAccountId: optionalText,
});

export const refundPaymentSchema = z.object({
  refundOfPaymentId: z.string().min(1, "Original payment is required."),
  amount: z.coerce.number().positive("Amount must be greater than 0.").optional(),
  paymentMode: z.enum(paymentModes),
  receiptNo: optionalText,
  notes: optionalText,
});
