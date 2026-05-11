import "server-only";
import type {
  AuthUserRecord,
  AuthUserRepository,
  UpsertGoogleUserInput,
  UpsertGoogleUserResult,
} from "../../application/ports/auth-user-repository";

export class NullAuthUserRepository implements AuthUserRepository {
  async findById(id: string): Promise<AuthUserRecord | null> {
    void id;
    throw new Error("Auth user repository is not configured yet");
  }

  async upsertGoogleUser(input: UpsertGoogleUserInput): Promise<UpsertGoogleUserResult> {
    void input;
    throw new Error("Auth user repository is not configured yet");
  }
}
