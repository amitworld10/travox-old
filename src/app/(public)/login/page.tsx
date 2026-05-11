import { getPublicEnv } from "@/config/public-env";
import { LoginClient } from "@/modules/auth/presentation/components/LoginClient";

export default function LoginPage() {
  const env = getPublicEnv();

  return <LoginClient googleClientId={env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} />;
}
