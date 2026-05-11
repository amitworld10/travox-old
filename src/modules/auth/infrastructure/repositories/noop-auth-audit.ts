import "server-only";
import type { AuditAuthEventInput, AuditAuthPort } from "../../application/ports/audit-auth-port";

export class NoopAuthAudit implements AuditAuthPort {
  async recordAuthEvent(input: AuditAuthEventInput): Promise<void> {
    void input;
    return undefined;
  }
}
