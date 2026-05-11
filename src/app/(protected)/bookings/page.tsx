import { ModuleOverviewPage } from "@/shared/presentation/components/server";

export default function BookingsPage() {
  return (
    <ModuleOverviewPage
      description="Booking aggregate workflows, nested PAX and itinerary forms, status actions, and travel-date views are scheduled after master data lands."
      metrics={[
        { label: "Primary Screen", value: "Management" },
        { label: "Validation", value: "Domain Rules" },
      ]}
      phase="Iteration 15"
      title="Bookings"
      workflows={["Booking list and filters", "Create and update booking", "PAX and segment editing", "Confirm, ticket, complete, cancel", "Upcoming and overdue views"]}
    />
  );
}
