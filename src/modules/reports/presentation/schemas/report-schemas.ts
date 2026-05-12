import { z } from "zod";
import { reportIds } from "../../application/report-dto";

const stringList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : value.split(",");
    return raw.map((item) => item.trim()).filter(Boolean);
  });

const boolParam = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((value) => value === true || value === "true" || value === "1" || value === "on");

export const reportIdSchema = z.enum(reportIds);

export const reportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customerIds: stringList,
  vendorIds: stringList,
  transactionTypes: stringList,
  paymentModes: stringList,
  serviceTypes: stringList,
  pendingOnly: boolParam,
  search: z.string().optional().default(""),
  sortBy: z.string().optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  includeRefunds: boolParam,
  includePaymentDetails: boolParam,
  includeZeroBalance: boolParam,
  bookingId: z.string().optional().default(""),
});

export function parseReportFilters(input: Record<string, string | string[] | undefined>) {
  const parsed = reportQuerySchema.parse(input);
  const today = new Date();
  const startDefault = new Date(today);
  startDefault.setMonth(startDefault.getMonth() - 3);
  return {
    ...parsed,
    startDate: parseDate(parsed.startDate, startDefault),
    endDate: parseDate(parsed.endDate, endOfDay(today)),
  };
}

function parseDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return value.length <= 10 ? endAwareDate(value, fallback) : date;
}

function endAwareDate(value: string, fallback: Date) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return fallback;
  return fallback.getHours() === 23 ? endOfDay(date) : date;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}
