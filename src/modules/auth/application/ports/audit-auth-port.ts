export type AuditAuthEventInput = {
  orgId: string;
  actorId: string;
  action: "LOGIN" | "LOGOUT" | "CREATE";
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export type AuditAuthPort = {
  recordAuthEvent(input: AuditAuthEventInput): Promise<void>;
};
