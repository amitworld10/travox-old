import { migrationPlaceholder } from "@/shared/presentation/http/not-implemented";

export function GET() {
  return migrationPlaceholder("GET", "/api/audit-logs/date-range");
}
