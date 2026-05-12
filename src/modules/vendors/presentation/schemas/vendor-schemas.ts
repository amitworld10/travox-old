import { z } from "zod";
import { serviceTypeLabels } from "../../application/vendor-dto";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export const vendorInputSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required."),
  serviceType: z.enum(serviceTypeLabels, { message: "Service type is required." }),
  pocName: optionalText,
  phone: z.string().trim().min(1, "Phone is required."),
  email: z.string().trim().email("Valid email is required."),
  gstin: optionalText.transform((value) => value?.toUpperCase()).pipe(z.string().regex(/^[0-9A-Z]{15}$/, "GSTIN must be 15 alphanumeric characters.").optional()),
  accountId: optionalText,
});

export type VendorInputPayload = z.infer<typeof vendorInputSchema>;
