import { migrationPlaceholder } from "@/shared/presentation/http/not-implemented";

export function GET() {
  return migrationPlaceholder("GET", "/api/customers/[id]");
}

export function PUT() {
  return migrationPlaceholder("PUT", "/api/customers/[id]");
}

export function DELETE() {
  return migrationPlaceholder("DELETE", "/api/customers/[id]");
}
