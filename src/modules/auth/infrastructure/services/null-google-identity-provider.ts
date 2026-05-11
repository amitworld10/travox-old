import "server-only";
import type {
  GoogleIdentity,
  GoogleIdentityProvider,
} from "../../application/ports/google-identity-provider";

export class NullGoogleIdentityProvider implements GoogleIdentityProvider {
  async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
    void idToken;
    throw new Error("Google identity provider adapter is not configured yet");
  }
}
