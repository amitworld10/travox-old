import { z } from "zod";

export const auditActionSchema = z.enum(["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "LOGIN", "LOGOUT", "ROLE_CHANGE", "PERMISSION_CHANGE"]);

export const auditLogFilterSchema = z.object({
  entity: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  actorId: z.string().trim().min(1).optional(),
  action: auditActionSchema.optional(),
  startDate: z.string().trim().min(1).optional(),
  endDate: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createAuditLogSchema = z.object({
  actorId: z.string().trim().min(1).optional(),
  entity: z.string().trim().min(1),
  entityId: z.string().trim().min(1),
  action: auditActionSchema,
  diff: z.unknown().default({}),
});
