import { migrationPlaceholder } from "@/shared/presentation/http/not-implemented";

export function GET() {
  return migrationPlaceholder("GET", "/api/files/[id]");
}

export function PUT() {
  return migrationPlaceholder("PUT", "/api/files/[id]");
}

export function DELETE() {
  return migrationPlaceholder("DELETE", "/api/files/[id]");
}
