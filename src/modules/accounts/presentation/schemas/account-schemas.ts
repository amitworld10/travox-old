import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export const accountInputSchema = z
  .object({
    bankName: optionalText,
    ifscCode: optionalText.transform((value) => value?.toUpperCase()),
    branchName: optionalText,
    accountNo: optionalText,
    upiId: optionalText,
    isActive: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.upiId || (value.accountNo && value.ifscCode)), {
    message: "Provide either UPI ID or both account number and IFSC code.",
    path: ["accountNo"],
  });

export type AccountInputPayload = z.infer<typeof accountInputSchema>;
