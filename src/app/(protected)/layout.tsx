import { redirect } from "next/navigation";
import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { logoutAction } from "@/modules/auth/presentation/actions/auth-actions";
import { getPublicEnv } from "@/config/public-env";
import { ProtectedShell } from "@/shared/presentation/shell/ProtectedShell";
import { getShellNavigationForActor } from "@/shared/presentation/shell/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login");
  }

  const navGroups = getShellNavigationForActor(actor);
  const publicEnv = getPublicEnv();

  return (
    <ProtectedShell
      actor={actor}
      maintenance={{
        enabled: publicEnv.NEXT_PUBLIC_MAINTENANCE_ENABLED,
        message: publicEnv.NEXT_PUBLIC_MAINTENANCE_MESSAGE,
        details: publicEnv.NEXT_PUBLIC_MAINTENANCE_DETAILS,
      }}
      logoutAction={logoutAction}
      navGroups={navGroups}
    >
      {children}
    </ProtectedShell>
  );
}
