import { migrationPlaceholder } from "@/shared/presentation/http/not-implemented";

export function GET() {
  return migrationPlaceholder("GET", "/api/accounts/[id]");
}

export function PUT() {
  return migrationPlaceholder("PUT", "/api/accounts/[id]");
}

export function DELETE() {
  return migrationPlaceholder("DELETE", "/api/accounts/[id]");
}
