export type AuditActionDto = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "LOGIN" | "LOGOUT" | "ROLE_CHANGE" | "PERMISSION_CHANGE";

export type AuditLogDto = {
  id: string;
  orgId: string;
  actorId: string;
  actorLabel: string;
  entity: string;
  entityId: string;
  action: AuditActionDto;
  diff: unknown;
  ip: string;
  userAgent: string;
  createdAt: string;
};

export type AuditLogFiltersDto = {
  entity?: string;
  entityId?: string;
  actorId?: string;
  action?: AuditActionDto;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
};

export type CreateAuditLogDto = {
  actorId: string;
  entity: string;
  entityId: string;
  action: AuditActionDto;
  diff: unknown;
  ip?: string;
  userAgent?: string;
};

export type AuditLogSearchResultDto = {
  logs: AuditLogDto[];
  total: number;
  limit: number;
  offset: number;
};

export type AuditLogStatsDto = {
  total: number;
  creates: number;
  updates: number;
  deletes: number;
  statusChanges: number;
  authEvents: number;
};
