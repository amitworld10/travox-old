import { migrationPlaceholder } from "@/shared/presentation/http/not-implemented";

export function GET() {
  return migrationPlaceholder("GET", "/api/accounts");
}

export function POST() {
  return migrationPlaceholder("POST", "/api/accounts");
}
