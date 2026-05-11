import { migrationPlaceholder } from "@/shared/presentation/http/not-implemented";

export function GET() {
  return migrationPlaceholder("GET", "/api/users/me");
}

export function PUT() {
  return migrationPlaceholder("PUT", "/api/users/me");
}
