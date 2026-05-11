import { ModuleOverviewPage } from "@/shared/presentation/components/server";

type LegacySurfacePageProps = {
  params: Promise<{ surface: string }>;
};

export default async function LegacySurfacePage({ params }: LegacySurfacePageProps) {
  const { surface } = await params;

  return (
    <ModuleOverviewPage
      description="Legacy routes remain available only as quarantined reference surfaces until product ownership explicitly brings them into the migrated Next app."
      metrics={[
        { label: "Surface", value: surface },
        { label: "Policy", value: "Quarantined" },
      ]}
      phase="Cutover"
      status="Quarantined"
      title={`Legacy: ${surface}`}
      workflows={["Keep legacy route isolated", "Avoid promoting inactive UI", "Review product ownership", "Migrate only by explicit request"]}
    />
  );
}
