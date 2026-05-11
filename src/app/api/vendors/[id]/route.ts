import { migrationPlaceholder } from "@/shared/presentation/http/not-implemented";

export function GET() {
  return migrationPlaceholder("GET", "/api/vendors/[id]");
}

export function PUT() {
  return migrationPlaceholder("PUT", "/api/vendors/[id]");
}

export function DELETE() {
  return migrationPlaceholder("DELETE", "/api/vendors/[id]");
}
