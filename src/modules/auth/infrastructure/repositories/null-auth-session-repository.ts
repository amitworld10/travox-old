import "server-only";
import type {
  AuthSessionRecord,
  AuthSessionRepository,
} from "../../application/ports/auth-session-repository";

export class NullAuthSessionRepository implements AuthSessionRepository {
  async create(record: Omit<AuthSessionRecord, "id">): Promise<AuthSessionRecord> {
    void record;
    throw new Error("Auth session repository is not configured yet");
  }

  async findByRefreshTokenHash(hash: string): Promise<AuthSessionRecord | null> {
    void hash;
    throw new Error("Auth session repository is not configured yet");
  }

  async revokeByRefreshTokenHash(hash: string): Promise<void> {
    void hash;
    throw new Error("Auth session repository is not configured yet");
  }
}
