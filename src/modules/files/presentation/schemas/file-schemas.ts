import { z } from "zod";
import { fileKinds } from "../../application/file-dto";

export const fileFilterSchema = z.object({
  kind: z.enum(fileKinds).optional(),
  uploadedBy: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const updateFileSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  kind: z.enum(fileKinds).optional(),
});

export function parseFileKind(value: FormDataEntryValue | null) {
  const parsed = z.enum(fileKinds).safeParse(String(value ?? ""));
  if (!parsed.success) throw new Error("Valid file kind is required.");
  return parsed.data;
}
