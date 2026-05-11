import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function UsersPage() {
  return (
    <ModuleOverviewPage
      description="Google sign-in, current actor resolution, permission-aware navigation, and auth cookies are active; user administration UI remains queued."
      metrics={[
        { label: "Auth Status", value: "Active", tone: "success" },
        { label: "Roles", value: "Owner / Admin" },
      ]}
      phase="Iteration 12 / 19"
      status="In progress"
      title="User Access"
      workflows={["Google login", "Refresh session", "Logout", "Permission-aware shell", "Activate, deactivate, and change roles"]}
    />
  );
}
