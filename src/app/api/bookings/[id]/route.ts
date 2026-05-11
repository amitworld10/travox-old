import { migrationPlaceholder } from "@/shared/presentation/http/not-implemented";

export function GET() {
  return migrationPlaceholder("GET", "/api/bookings/[id]");
}

export function PUT() {
  return migrationPlaceholder("PUT", "/api/bookings/[id]");
}

export function DELETE() {
  return migrationPlaceholder("DELETE", "/api/bookings/[id]");
}
