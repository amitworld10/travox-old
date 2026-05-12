import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required."),
  phone: optionalText,
  email: optionalText.pipe(z.string().email().optional()),
  passportNo: optionalText.transform((value) => value?.toUpperCase()).pipe(z.string().max(8).optional()),
  aadhaarNo: optionalText.pipe(z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits.").optional()),
  visaNo: optionalText,
  gstin: optionalText.transform((value) => value?.toUpperCase()).pipe(z.string().regex(/^[0-9A-Z]{15}$/, "GSTIN must be 15 alphanumeric characters.").optional()),
  accountId: optionalText,
});

export const customerImportSchema = z.object({
  rows: z.array(customerInputSchema).min(1),
});

export type CustomerInputPayload = z.infer<typeof customerInputSchema>;
