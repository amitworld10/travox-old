# End-to-End Migration Plan: Travox to Next.js Clean Architecture

## Purpose

This is the single end-to-end migration guide for moving Travox from the current split architecture into the architecture defined in `nextjs-architecture.md`.

Current architecture:

- Frontend: React 18, Vite, Tailwind, React Router, Axios.
- Backend: Express 5, TypeScript, tsyringe, MongoDB/Mongoose, Redis, JWT, Google OIDC, Google Drive/local file fallback, Gemini OCR, Swagger.
- Database: MongoDB with Mongoose schemas and embedded booking child records.

Target architecture:

- Full-stack Next.js App Router.
- Modular monolith.
- Clean Architecture with domain, application, infrastructure, and presentation boundaries.
- Prisma ORM.
- Supabase Postgres as the primary database.
- Future Mongo support only through infrastructure adapters.
- Internal auth and internal permission-based authorization.
- Route handlers and server actions as delivery mechanisms.
- DTOs and mappers at every boundary.

This file merges the backend migration plan and frontend migration plan into one implementation sequence. It also provides the initial Prisma/Postgres data model needed to replace Mongo/Mongoose.

## Non-Negotiable Rules

- Do not import Prisma outside infrastructure.
- Do not import Supabase clients outside infrastructure.
- Do not import Mongo/Mongoose outside infrastructure.
- Do not expose Prisma records to server actions, route handlers, React components, or API responses.
- Do not put business logic in React components.
- Do not put business logic in server actions.
- Do not put business logic in route handlers.
- Validate all route-handler and server-action input with Zod.
- Every protected use case receives `ActorContext`.
- Every protected use case performs authorization through the authorization module.
- Use permission checks, not scattered role checks.
- Domain entities must not know Next.js, React, HTTP, Prisma, Mongoose, Supabase, Redis, Google APIs, Gemini, or file-system APIs.
- Use DTOs for all input/output boundaries.
- Use mappers between persistence records, domain entities, and response DTOs.
- Use soft delete for business data unless hard delete is explicitly required.
- Audit critical mutations.
- Store refresh tokens hashed.
- Use httpOnly, secure, sameSite-configured cookies.
- Mark server-only infrastructure modules with `import "server-only"`.

## Migration Shape

The migration should happen in three tracks that converge:

1. App shell and UI parity.
2. Backend delivery and use-case migration.
3. Database migration to Prisma/Supabase Postgres.

Do not begin by rewriting everything in place. Build the target architecture beside the old behavior, prove parity module by module, and then retire the old Express/Vite/Mongo surfaces.

## Target Repository Structure

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    loading.tsx
    not-found.tsx
    (public)/
      login/page.tsx
    (protected)/
      layout.tsx
      customers/page.tsx
      customers/report/page.tsx
      vendors/page.tsx
      vendors/report/page.tsx
      bookings/page.tsx
      payments/page.tsx
      expenses/page.tsx
      refunds/page.tsx
      reports/page.tsx
      reports/[reportId]/page.tsx
      logs/page.tsx
      users/page.tsx
      legacy/[surface]/page.tsx
    api/
      auth/
      customers/
      vendors/
      bookings/
      payments/
      accounts/
      reports/
      audit-logs/
      users/
      files/
      scan/
      schema/
      metrics/
  modules/
    auth/
    authorization/
    users/
    organizations/
    customers/
    vendors/
    bookings/
    payments/
    accounts/
    reports/
    audit-logs/
    files/
    ocr/
    observability/
    legacy/
  shared/
    domain/
    application/
    infrastructure/
    presentation/
  container/
    dependency-container.ts
    repository-provider.ts
  config/
    env.ts
  tests/
    unit/
    integration/
    e2e/
prisma/
  schema.prisma
  migrations/
  seed.ts
```

Each business module should use:

```text
domain/
  entities/
  value-objects/
  repositories/
  services/
  errors/
application/
  dto/
  use-cases/
  ports/
  validators/
infrastructure/
  prisma/
  mongo/
  external/
presentation/
  actions/
  schemas/
  components/
  mappers/
```

## Route Parity Map

### UI Routes

| Current UI route | Target App Router route | Module |
| --- | --- | --- |
| `/` | `src/app/page.tsx` redirect | auth |
| `/login` new canonical route | `src/app/(public)/login/page.tsx` | auth |
| `/customers` | `src/app/(protected)/customers/page.tsx` | customers |
| `/customers/report` | `src/app/(protected)/customers/report/page.tsx` | reports/customers |
| `/vendors` | `src/app/(protected)/vendors/page.tsx` | vendors |
| `/vendors/report` | `src/app/(protected)/vendors/report/page.tsx` | reports/vendors |
| `/bookings` | `src/app/(protected)/bookings/page.tsx` | bookings |
| `/payments` | `src/app/(protected)/payments/page.tsx` | payments |
| `/expenses` | `src/app/(protected)/expenses/page.tsx` | payments |
| `/refunds` | `src/app/(protected)/refunds/page.tsx` | payments |
| `/reports` | `src/app/(protected)/reports/page.tsx` | reports |
| `/reports/:reportId` | `src/app/(protected)/reports/[reportId]/page.tsx` | reports |
| `/logs` | `src/app/(protected)/logs/page.tsx` | audit-logs |
| `/users` | `src/app/(protected)/users/page.tsx` | users/authorization |
| `/legacy/:surface` | `src/app/(protected)/legacy/[surface]/page.tsx` | legacy |

### API Routes

| Current Express route | Target route handler | Module |
| --- | --- | --- |
| `POST /auth/google` | `src/app/api/auth/google/route.ts` | auth |
| `POST /auth/logout` | `src/app/api/auth/logout/route.ts` | auth |
| `POST /auth/refresh` | `src/app/api/auth/refresh/route.ts` | auth |
| `GET/POST /customers` | `src/app/api/customers/route.ts` | customers |
| `POST /customers/import` | `src/app/api/customers/import/route.ts` | customers |
| `GET /customers/search` | `src/app/api/customers/search/route.ts` | customers |
| `GET /customers/report` | `src/app/api/customers/report/route.ts` | reports |
| `GET/PUT/DELETE /customers/:id` | `src/app/api/customers/[id]/route.ts` | customers |
| `GET /customers/:id/stats` | `src/app/api/customers/[id]/stats/route.ts` | customers |
| `GET /customers/:id/bookings` | `src/app/api/customers/[id]/bookings/route.ts` | bookings |
| `GET /customers/:id/account` | `src/app/api/customers/[id]/account/route.ts` | accounts |
| `GET/POST /vendors` | `src/app/api/vendors/route.ts` | vendors |
| `GET /vendors/search` | `src/app/api/vendors/search/route.ts` | vendors |
| `GET /vendors/report` | `src/app/api/vendors/report/route.ts` | reports |
| `GET/PUT/DELETE /vendors/:id` | `src/app/api/vendors/[id]/route.ts` | vendors |
| `GET /vendors/:id/stats` | `src/app/api/vendors/[id]/stats/route.ts` | vendors |
| `GET /vendors/:id/account` | `src/app/api/vendors/[id]/account/route.ts` | accounts |
| `GET/POST /bookings` | `src/app/api/bookings/route.ts` | bookings |
| `GET /bookings/search` | `src/app/api/bookings/search/route.ts` | bookings |
| `GET /bookings/filter` | `src/app/api/bookings/filter/route.ts` | bookings |
| `GET /bookings/upcoming` | `src/app/api/bookings/upcoming/route.ts` | bookings |
| `GET /bookings/overdue` | `src/app/api/bookings/overdue/route.ts` | bookings |
| `GET /bookings/revenue-stats` | `src/app/api/bookings/revenue-stats/route.ts` | bookings |
| `GET /bookings/stats` | `src/app/api/bookings/stats/route.ts` | bookings |
| `GET /bookings/travel-dates` | `src/app/api/bookings/travel-dates/route.ts` | bookings |
| `GET/PUT/DELETE /bookings/:id` | `src/app/api/bookings/[id]/route.ts` | bookings |
| `PATCH /bookings/:id/status` | `src/app/api/bookings/[id]/status/route.ts` | bookings |
| `PATCH /bookings/:id/cancel` | `src/app/api/bookings/[id]/cancel/route.ts` | bookings |
| `PATCH /bookings/:id/confirm` | `src/app/api/bookings/[id]/confirm/route.ts` | bookings |
| `PATCH /bookings/:id/complete` | `src/app/api/bookings/[id]/complete/route.ts` | bookings |
| `GET/POST /accounts` | `src/app/api/accounts/route.ts` | accounts |
| `GET/PUT/DELETE /accounts/:id` | `src/app/api/accounts/[id]/route.ts` | accounts |
| `POST /accounts/:id/archive` | `src/app/api/accounts/[id]/archive/route.ts` | accounts |
| `GET /payments` | `src/app/api/payments/route.ts` | payments |
| `GET /payments/:id` | `src/app/api/payments/[id]/route.ts` | payments |
| `POST /payments/receivable` | `src/app/api/payments/receivable/route.ts` | payments |
| `POST /payments/expense` | `src/app/api/payments/expense/route.ts` | payments |
| `POST /payments/inbound-refund` | `src/app/api/payments/inbound-refund/route.ts` | payments |
| `POST /payments/outbound-refund` | `src/app/api/payments/outbound-refund/route.ts` | payments |
| `GET /reports/catalog` | `src/app/api/reports/catalog/route.ts` | reports |
| `GET /reports/:reportId` | `src/app/api/reports/[reportId]/route.ts` | reports |
| `GET/POST /audit-logs` | `src/app/api/audit-logs/route.ts` | audit-logs |
| `GET /audit-logs/export` | `src/app/api/audit-logs/export/route.ts` | audit-logs |
| `GET /audit-logs/entity/:entity/:entityId` | `src/app/api/audit-logs/entity/[entity]/[entityId]/route.ts` | audit-logs |
| `GET /audit-logs/actor/:actorId` | `src/app/api/audit-logs/actor/[actorId]/route.ts` | audit-logs |
| `GET /audit-logs/date-range` | `src/app/api/audit-logs/date-range/route.ts` | audit-logs |
| `GET /users` | `src/app/api/users/route.ts` | users |
| `GET/PUT /users/me` | `src/app/api/users/me/route.ts` | users |
| `GET /users/:id` | `src/app/api/users/[id]/route.ts` | users |
| `PATCH /users/change-role` | `src/app/api/users/change-role/route.ts` | authorization |
| `PATCH /users/:id/activate` | `src/app/api/users/[id]/activate/route.ts` | users |
| `PATCH /users/:id/deactivate` | `src/app/api/users/[id]/deactivate/route.ts` | users |
| `GET/POST /files` | `src/app/api/files/route.ts` | files |
| `GET/PUT/DELETE /files/:id` | `src/app/api/files/[id]/route.ts` | files |
| `GET /files/:id/download` | `src/app/api/files/[id]/download/route.ts` | files |
| `GET/POST /scan` | `src/app/api/scan/route.ts` | ocr |
| `GET /schema` | `src/app/api/schema/route.ts` | ocr |
| `GET /metrics` | `src/app/api/metrics/route.ts` | observability |
| `POST /metrics/reset` | `src/app/api/metrics/reset/route.ts` | observability |

## End-to-End Migration Phases

### Phase 0: Freeze Behavior and Create Safety Net

Before implementation:

- Capture current route inventory.
- Capture current UI route inventory.
- Add smoke tests for login, customers, vendors, bookings, payments, expenses, refunds, reports, audit logs, users, files, and OCR if practical.
- Document current environment variables.
- Export a Mongo data sample for schema validation.
- Decide whether production data must be migrated or only new deployments need the Postgres schema.

Done when:

- Current behavior is documented.
- Critical money and booking workflows have at least manual test scripts.
- Data migration scope is known.

### Phase 1: Create Next.js Foundation

Build the target shell:

- Install Next.js, Prisma, `@prisma/client`, `server-only`, Zod, Jose or selected JWT library, UUID, Tailwind, UI dependencies, Vitest, Playwright.
- Create App Router folders.
- Create root layout, protected layout, public login route, global CSS, loading/not-found files.
- Move brand assets.
- Move shared UI primitives.
- Create env validation.
- Create server-only Prisma client.
- Create server-only Redis cache adapter.
- Create dependency container/factories.
- Create shared error, result, actor context, pagination, logger, cache, and transaction ports.

Done when:

- Next app builds.
- Env validation works.
- Empty protected pages can resolve actor and redirect guests.
- Prisma validates against the schema draft.

### Phase 2: Port Auth and Authorization

Backend:

- Port Google login, logout, refresh, current actor.
- Add hashed refresh tokens and auth sessions.
- Add authorization module with roles, permissions, user roles, role permissions.
- Seed Owner/Admin compatibility roles.
- Replace role arrays with permission checks.

Frontend:

- Port login page.
- Replace local/session storage auth with httpOnly cookie flow.
- Add session-expired feedback.
- Add permission-aware protected layout navigation.

Database:

- Migrate users, auth identities, auth sessions, roles, permissions, user roles, role permissions.

Done when:

- User can login, refresh, logout.
- Protected pages redirect correctly.
- Admin/Owner compatibility works.
- Permission checks happen server-side.

### Phase 3: Port Shared Shell and Design System

Frontend:

- Port Button, Modal, Table, Pagination, Badge, Card, Spinner, Toast, SearchField, PageHeader, StatCard.
- Port protected layout shell.
- Port sidebar navigation groups.
- Port breadcrumbs, command palette, quick actions, maintenance banner, dark mode.

Backend:

- Provide current actor DTO and navigation permission DTO.

Done when:

- Protected shell renders.
- Navigation reflects permissions.
- Quick actions can dispatch to module screens.

### Phase 4: Port Master Data Modules

Modules:

- Organizations.
- Accounts.
- Customers.
- Vendors.

Backend:

- Port domain entities.
- Port use cases.
- Add Zod schemas.
- Add route handlers.
- Add server actions for create/update/delete/import.
- Add Prisma repositories and mappers.

Frontend:

- Port customers list, search, table, stats, bookings modal, create/edit form, import flow, report link.
- Port vendors list, search, table, stats, create/edit form, report link.
- Port account lookup UX needed by payment/expense workflows.

Database:

- Migrate organizations, accounts, customers, vendors.
- Preserve account links used to infer customer/vendor in payment workflows.

Done when:

- Customer and vendor CRUD/search/report entry points work.
- Accounts can be created/updated/archived.
- Existing customer/vendor totals are preserved.

### Phase 5: Port Bookings

Backend:

- Port booking aggregate: booking, PAX, itinerary, segment.
- Port create, update, list, search, filter, upcoming, overdue, travel dates, stats, revenue stats, delete.
- Port status transitions: confirm, ticket, complete, cancel, refunded.
- Keep mode-specific validation in domain/application.
- Add transaction boundaries for booking plus customer/vendor count changes.

Frontend:

- Port booking management view.
- Port booking filters.
- Port booking form and nested form state.
- Port customer search dropdown.
- Port table actions and status actions.

Database:

- Migrate bookings from embedded Mongo arrays into relational tables:
  - bookings
  - booking_pax
  - booking_itineraries
  - booking_segments

Done when:

- Booking create/edit/status workflows work.
- Nested PAX and segments round-trip correctly.
- Derived fields are accurate.
- Customer/vendor booking counts remain correct.

### Phase 6: Port Payments, Expenses, Refunds

Backend:

- Port receivable payment workflow.
- Port expense workflow.
- Port inbound refund workflow.
- Port outbound refund workflow.
- Add transaction manager around every multi-write money workflow.
- Preserve cache invalidation before stale-sensitive reads.
- Preserve report cache invalidation after writes.

Frontend:

- Port payments list and form.
- Port expenses list and form.
- Port refunds list and dialog.
- Keep account/customer/vendor/booking lookup DTOs safe and typed.

Database:

- Migrate payments with `paymentType`.
- Preserve booking/customer/vendor/account links.
- Preserve refund source relation through `refundOfPaymentId`.

Done when:

- Overpayment prevention works.
- Expense updates vendor totals.
- Inbound refund reverses vendor expense.
- Outbound refund reverses customer spend and booking paid state.
- Reports reflect changes.

### Phase 7: Port Reports

Backend:

- Port report catalog.
- Port `GetReportData`.
- Port customer bookings report.
- Port vendor expenses/bookings report.
- Add report filter schemas.
- Add cache port and Redis implementation.
- Preserve 5-minute report TTL and normalized cache keys.

Frontend:

- Port reporting center.
- Port report runner.
- Port customer report.
- Port vendor report.
- Move export/download through route handlers.

Database:

- Optimize indexes for report-heavy filters.
- Ensure payment and booking relations support base dataset loading.

Done when:

- Every supported report ID returns accurate rows and totals.
- Filters and exports work.
- Cache invalidation works after booking/payment/refund changes.

### Phase 8: Port Files and OCR

Backend:

- Port file metadata use cases.
- Port storage port with Google Drive and local adapters.
- Replace multer with `request.formData()`.
- Port OCR provider port and Gemini adapter.
- Port scan by upload and scan by file ID.
- Port schema reflection.

Frontend:

- Keep active file/OCR UI surfaces if product-owned.
- Keep legacy ticket upload quarantined unless explicitly revived.

Database:

- Migrate file metadata.
- Add OCR job table.

Done when:

- Upload/download/delete works.
- OCR returns structured extraction when configured.
- OCR returns clear configuration error when not configured.

### Phase 9: Port Audit Logs, Metrics, Observability

Backend:

- Replace Express audit middleware with use-case audit calls.
- Port audit log queries and CSV export.
- Port cache metrics and reset.
- Add route-handler logging wrapper.
- Add error mapper.

Frontend:

- Port audit log list and detail modal.
- Port owner/permission-only metrics surface if needed.

Database:

- Migrate audit logs.
- Keep audit logs immutable.

Done when:

- Critical mutations write audit logs.
- Audit filters and export work.
- Metrics read/reset works through cache port.

### Phase 10: Data Migration and Cutover

Data:

- Create Mongo export scripts.
- Create transformation scripts from Mongo JSON to Prisma createMany/upsert batches.
- Map Mongo ObjectIds/string IDs into UUID-compatible IDs or preserve string UUIDs if already used.
- Split embedded booking arrays into relational rows.
- Hash or rehash refresh tokens if raw formats differ.
- Reconcile customer totals, vendor totals, booking paid/due/refunded values, and report totals.

App:

- Switch repository provider to Prisma.
- Disable Mongo adapters in production.
- Remove Express upstream API.
- Remove Vite SPA.
- Remove browser token storage.

Done when:

- Data counts match.
- Critical totals reconcile.
- All route parity checks pass.
- Old API and SPA can be retired.

## Module-by-Module Target

### Auth Module

Frontend:

- Public login page.
- Google sign-in button.
- Loading, error, and already-authenticated redirect states.
- Session-expired feedback.

Backend:

- `google-login.use-case.ts`
- `refresh-session.use-case.ts`
- `logout.use-case.ts`
- `get-current-actor.use-case.ts`
- Token service port.
- Google identity provider port.
- Auth session repository.

Database:

- `users`
- `auth_identities`
- `auth_sessions`

Permissions:

- Login does not require an existing permission.
- Refresh requires valid refresh session.
- Logout requires current actor or valid refresh token context.

### Authorization Module

Frontend:

- Permission-aware navigation.
- User management role controls.
- Future role/permission matrix if product enables it.

Backend:

- Authorization service.
- Permission checker.
- Role assignment use cases.
- Role revoke/change use cases.

Database:

- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

Permissions:

- `users.role.update.any`
- `roles.read.any`
- `roles.assign.any`
- `permissions.read.any`

### Customers Module

Frontend:

- Customer table.
- Search.
- Create/edit modal.
- Customer bookings modal.
- Import CSV.
- Report entry.

Backend:

- Create customer.
- Update customer.
- Delete/soft-delete customer.
- Search/list/customer stats.
- Get customer account.
- Bulk import.

Database:

- `customers`
- optional relation to `accounts`.

Key invariants:

- Customer operations are org-scoped.
- Customer account links are used to derive customer for receivables.
- Sensitive identity fields must be masked unless explicitly unmasked.

### Vendors Module

Frontend:

- Vendor table.
- Search.
- Create/edit modal.
- Vendor report entry.

Backend:

- Create vendor.
- Update vendor.
- Delete/soft-delete vendor.
- Search/list/stats.
- Get vendor account.

Database:

- `vendors`
- optional relation to `accounts`.

Key invariants:

- Vendor operations are org-scoped.
- Vendor account links are used to derive vendor for expenses.
- Service type must be a known enum.

### Bookings Module

Frontend:

- Booking table.
- Search and filters.
- Create/edit booking form.
- Customer search dropdown.
- Nested PAX controls.
- Nested itinerary/segment controls.
- Status actions.

Backend:

- Create booking.
- Update booking.
- Search/list/filter.
- Status transition use cases.
- Stats and date queries.
- Delete/archive.

Database:

- `bookings`
- `booking_pax`
- `booking_itineraries`
- `booking_segments`

Key invariants:

- Booking requires customer, currency, positive total, and at least one PAX.
- PAX requires name and type.
- Segment mode-specific validation remains.
- Derived fields must be recalculated after child changes.
- Completion requires ended travel and zero due unless override.

### Accounts Module

Frontend:

- Account selectors inside payment/expense/customer/vendor flows.
- Optional account management UI.

Backend:

- Create account.
- Update account.
- List/get account.
- Archive account.
- Delete only where explicitly permitted.

Database:

- `accounts`

Key invariants:

- Accounts are org-scoped.
- Archive is preferred over hard delete.
- Account IDs are used by customer/vendor/payment workflows.

### Payments Module

Frontend:

- Payments table.
- Payment creation form.
- Expenses table/form.
- Refund table/dialog.

Backend:

- Create receivable.
- Create expense.
- Create inbound refund.
- Create outbound refund.
- List/get payments.

Database:

- `payments`

Key invariants:

- Receivable cannot exceed booking due.
- Receivable updates booking paid/due and customer total spent.
- Expense updates vendor total expense.
- Inbound refund reverses expense and vendor total.
- Outbound refund reverses receivable and booking paid/refund state.
- All multi-write workflows must be transactional.

### Reports Module

Frontend:

- Reporting center.
- Dynamic report runner.
- Customer report page.
- Vendor report page.
- Export actions.

Backend:

- Report catalog.
- Report data by ID.
- Customer booking report.
- Vendor booking/expense report.
- Export route handlers.

Database:

- No report tables required initially.
- Uses bookings, customers, vendors, payments.
- Redis cache stores computed report payloads.

Supported report IDs:

- `sales-by-customer-detail`
- `customer-balance-detail`
- `customer-payment-details`
- `payment-details-by-customer`
- `customer-ledger`
- `invoice-credit-note-list-by-date`
- `invoice-list`
- `invoices-by-month`
- `sales-by-product-service-detail`
- `transaction-list-by-customer`
- `transaction-list-by-date`
- `payment-splits-by-customer`
- `vendor-ledger`
- `outstanding-payments`
- `monthly-income-expense`
- `refund-register`
- `booking-register`
- `gst-view`

### Files and OCR Modules

Frontend:

- Upload surface where active.
- Download links.
- OCR scan controls where active.
- Legacy ticket upload stays quarantined until product decision.

Backend:

- File metadata CRUD.
- File upload/download/delete.
- Storage provider port.
- OCR provider port.
- Scan upload.
- Scan existing file.
- Schema reflection.

Database:

- `files`
- `ocr_jobs`

Key invariants:

- File buffers are never logged.
- OCR is optional and must fail gracefully if not configured.
- Storage provider details never leak to domain/application.

### Audit Logs and Observability

Frontend:

- Audit log table.
- Detail modal.
- Filters/export if present.

Backend:

- Audit creation through application service.
- Audit query use cases.
- CSV export.
- Cache metrics read/reset.
- Structured logging wrapper.

Database:

- `audit_logs`

Key invariants:

- Audit logs are immutable.
- Sensitive values are masked.
- Role/permission changes are always audited.

## Prisma and Supabase Setup

Use Prisma with Supabase Postgres.

Environment:

```env
DATABASE_URL="postgres://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"
```

Prisma datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Rules:

- Use `DATABASE_URL` for application runtime.
- Use `DIRECT_URL` for Prisma migrations.
- Do not use Supabase Auth as the core auth system unless product direction changes.
- Do not depend on Supabase RLS as the primary authorization mechanism.
- Internal authorization remains mandatory in use cases.
- RLS may be added later as defense-in-depth only.

## Prisma Data Model Draft

This is the initial Prisma schema draft for the migrated product. It is intended to be implemented in `prisma/schema.prisma` and refined during migration. Money uses `Decimal`; domain mappers should convert to domain money/value objects or safe DTO strings/numbers as decided by the application layer.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  DISABLED
  LOCKED
}

enum AuthProvider {
  GOOGLE
  PASSWORD
}

enum ServiceType {
  AIRLINE
  HOTEL
  RAIL
  BUS
  CAB
  DMC
  VISA
  INSURANCE
  OTHER
}

enum BookingStatus {
  DRAFT
  CONFIRMED
  TICKETED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaxType {
  ADT
  CHD
  INF
}

enum Sex {
  MALE
  FEMALE
  TRANSGENDER
}

enum ModeOfJourney {
  FLIGHT
  TRAIN
  BUS
  HOTEL
  CAB
  OTHER
}

enum PaymentType {
  RECEIVABLE
  EXPENSE
  REFUND_INBOUND
  REFUND_OUTBOUND
}

enum PaymentMode {
  CASH
  CARD
  UPI
  NETBANKING
  BANK_TRANSFER
  CHEQUE
  WALLET
  OTHER
}

enum FileKind {
  TICKET
  INVOICE
  VOUCHER
  PASSPORT
  VISA
  OTHER
}

enum OcrStatus {
  PENDING
  SUCCESS
  FAILED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  STATUS_CHANGE
  LOGIN
  LOGOUT
  ROLE_CHANGE
  PERMISSION_CHANGE
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  users      User[]
  accounts   Account[]
  customers  Customer[]
  vendors    Vendor[]
  bookings   Booking[]
  payments   Payment[]
  files      FileAsset[]
  ocrJobs    OcrJob[]
  auditLogs  AuditLog[]

  @@index([deletedAt])
  @@map("organizations")
}

model User {
  id          String     @id @default(uuid())
  orgId       String
  email       String?
  name        String?
  phone       String?
  avatar      String?
  status      UserStatus @default(INACTIVE)
  timezone    String     @default("Asia/Kolkata")
  locale      String?
  dateFormat  String?
  theme       String?
  lastLoginAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?

  org            Organization   @relation(fields: [orgId], references: [id])
  identities     AuthIdentity[]
  sessions       AuthSession[]
  roles          UserRole[]
  uploadedFiles  FileAsset[]    @relation("FileUploadedBy")
  auditLogs      AuditLog[]     @relation("AuditActor")

  @@index([orgId, email])
  @@index([orgId, status])
  @@index([deletedAt])
  @@map("users")
}

model AuthIdentity {
  id          String       @id @default(uuid())
  orgId       String
  userId      String
  provider    AuthProvider
  providerSub String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerSub])
  @@index([orgId, userId])
  @@map("auth_identities")
}

model AuthSession {
  id               String    @id @default(uuid())
  userId           String
  refreshTokenHash String    @unique
  userAgent        String?
  ipAddress        String?
  expiresAt        DateTime
  revokedAt        DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([revokedAt])
  @@map("auth_sessions")
}

model Role {
  id          String    @id @default(uuid())
  code        String    @unique
  name        String
  description String?
  isSystem    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  users       UserRole[]
  permissions RolePermission[]

  @@index([deletedAt])
  @@map("roles")
}

model Permission {
  id          String   @id @default(uuid())
  code        String   @unique
  resource    String
  action      String
  scope       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  roles RolePermission[]

  @@index([resource, action, scope])
  @@map("permissions")
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())
  createdBy String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([roleId])
  @@map("user_roles")
}

model RolePermission {
  id           String   @id @default(uuid())
  roleId       String
  permissionId String
  createdAt    DateTime @default(now())
  createdBy    String?

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([permissionId])
  @@map("role_permissions")
}

model Account {
  id         String    @id @default(uuid())
  orgId      String
  bankName   String?
  ifscCode   String?
  branchName String?
  accountNo  String?
  upiId      String?
  isActive   Boolean   @default(true)
  createdBy  String
  updatedBy  String
  archivedAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?

  org              Organization @relation(fields: [orgId], references: [id])
  customers        Customer[]
  vendors          Vendor[]
  incomingPayments Payment[]    @relation("PaymentToAccount")
  outgoingPayments Payment[]    @relation("PaymentFromAccount")

  @@index([orgId, archivedAt])
  @@index([orgId, isActive])
  @@index([deletedAt])
  @@map("accounts")
}

model Customer {
  id            String    @id @default(uuid())
  orgId         String
  name          String
  phone         String?
  email         String?
  passportNo    String?
  aadhaarNo     String?
  visaNo        String?
  gstin         String?
  accountId     String?
  totalBookings Int       @default(0)
  totalSpent    Decimal   @default(0) @db.Decimal(14, 2)
  createdBy     String
  updatedBy     String
  isDeleted     Boolean   @default(false)
  archivedAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  org      Organization @relation(fields: [orgId], references: [id])
  account  Account?     @relation(fields: [accountId], references: [id])
  bookings Booking[]
  payments Payment[]

  @@index([orgId, isDeleted])
  @@index([orgId, email])
  @@index([orgId, phone])
  @@index([orgId, passportNo])
  @@index([orgId, accountId])
  @@index([orgId, updatedAt])
  @@index([deletedAt])
  @@map("customers")
}

model Vendor {
  id            String      @id @default(uuid())
  orgId         String
  name          String
  serviceType   ServiceType
  pocName       String?
  phone         String?
  email         String?
  gstin         String?
  accountId     String?
  totalExpense  Decimal     @default(0) @db.Decimal(14, 2)
  totalBookings Int         @default(0)
  createdBy     String
  updatedBy     String
  isDeleted     Boolean     @default(false)
  archivedAt    DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?

  org      Organization @relation(fields: [orgId], references: [id])
  account  Account?     @relation(fields: [accountId], references: [id])
  bookings Booking[]
  payments Payment[]

  @@index([orgId, isDeleted])
  @@index([orgId, email])
  @@index([orgId, phone])
  @@index([orgId, serviceType])
  @@index([orgId, name, serviceType])
  @@index([orgId, accountId])
  @@index([deletedAt])
  @@map("vendors")
}

model Booking {
  id             String        @id @default(uuid())
  orgId          String
  customerId     String
  vendorId       String?
  ticketFileId   String?
  bookingDate    DateTime
  currency       String
  totalAmount    Decimal       @db.Decimal(14, 2)
  paidAmount     Decimal       @default(0) @db.Decimal(14, 2)
  refundedAmount Decimal       @default(0) @db.Decimal(14, 2)
  dueAmount      Decimal       @db.Decimal(14, 2)
  paxCount       Int           @default(0)
  primaryPaxName String?
  travelStartAt  DateTime?
  travelEndAt    DateTime?
  packageName    String?
  pnrNo          String?
  modeOfJourney  String?
  advanceAmount  Decimal?      @db.Decimal(14, 2)
  status         BookingStatus @default(DRAFT)
  createdBy      String
  updatedBy      String
  isDeleted      Boolean       @default(false)
  archivedAt     DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  org         Organization       @relation(fields: [orgId], references: [id])
  customer    Customer           @relation(fields: [customerId], references: [id])
  vendor      Vendor?            @relation(fields: [vendorId], references: [id])
  ticketFile  FileAsset?         @relation("BookingTicketFile", fields: [ticketFileId], references: [id])
  pax         BookingPax[]
  itineraries BookingItinerary[]
  payments    Payment[]

  @@index([orgId, isDeleted])
  @@index([orgId, customerId, isDeleted])
  @@index([orgId, vendorId, isDeleted])
  @@index([orgId, status, isDeleted])
  @@index([orgId, bookingDate, isDeleted])
  @@index([orgId, travelStartAt, isDeleted])
  @@index([orgId, travelEndAt, isDeleted])
  @@index([orgId, createdAt])
  @@index([orgId, pnrNo])
  @@index([deletedAt])
  @@map("bookings")
}

model BookingPax {
  id         String   @id @default(uuid())
  orgId      String
  bookingId  String
  paxName    String
  paxType    PaxType
  sex        Sex?
  passportNo String?
  dob        DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([orgId, bookingId])
  @@map("booking_pax")
}

model BookingItinerary {
  id        String   @id @default(uuid())
  orgId     String
  bookingId String
  name      String
  seqNo     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  booking  Booking         @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  segments BookingSegment[]

  @@index([orgId, bookingId])
  @@unique([bookingId, seqNo])
  @@map("booking_itineraries")
}

model BookingSegment {
  id            String        @id @default(uuid())
  orgId         String
  itineraryId   String
  seqNo         Int
  modeOfJourney ModeOfJourney
  carrierCode   String?
  serviceNumber String?
  depCode       String?
  arrCode       String?
  depAt         DateTime?
  arrAt         DateTime?
  classCode     String?
  baggage       String?
  hotelName     String?
  hotelAddress  String?
  checkIn       DateTime?
  checkOut      DateTime?
  roomType      String?
  mealPlan      String?
  operatorName  String?
  boardingPoint String?
  dropPoint     String?
  misc          Json?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  itinerary BookingItinerary @relation(fields: [itineraryId], references: [id], onDelete: Cascade)

  @@index([orgId, itineraryId])
  @@unique([itineraryId, seqNo])
  @@index([modeOfJourney])
  @@map("booking_segments")
}

model Payment {
  id                String      @id @default(uuid())
  orgId             String
  paymentType       PaymentType
  amount            Decimal     @db.Decimal(14, 2)
  currency          String
  paymentMode       PaymentMode
  bookingId         String?
  customerId        String?
  vendorId          String?
  relatedInvoiceId  String?
  refundOfPaymentId String?
  category          String?
  notes             String?
  receiptNo         String?
  fromAccountId     String?
  toAccountId       String?
  createdBy         String
  updatedBy         String
  isDeleted         Boolean     @default(false)
  archivedAt        DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?

  org             Organization @relation(fields: [orgId], references: [id])
  booking         Booking?     @relation(fields: [bookingId], references: [id])
  customer        Customer?    @relation(fields: [customerId], references: [id])
  vendor          Vendor?      @relation(fields: [vendorId], references: [id])
  fromAccount     Account?     @relation("PaymentFromAccount", fields: [fromAccountId], references: [id])
  toAccount       Account?     @relation("PaymentToAccount", fields: [toAccountId], references: [id])
  refundOfPayment Payment?     @relation("PaymentRefunds", fields: [refundOfPaymentId], references: [id])
  refunds         Payment[]    @relation("PaymentRefunds")

  @@index([orgId, isDeleted])
  @@index([orgId, bookingId, isDeleted])
  @@index([orgId, customerId, isDeleted])
  @@index([orgId, vendorId, isDeleted])
  @@index([orgId, paymentType, isDeleted])
  @@index([orgId, createdAt])
  @@index([refundOfPaymentId])
  @@index([deletedAt])
  @@map("payments")
}

model FileAsset {
  id         String    @id @default(uuid())
  orgId      String
  name       String
  mimeType   String
  size       Int
  kind       FileKind
  storageKey String
  provider   String
  uploadedBy String
  uploadedAt DateTime
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?

  org       Organization @relation(fields: [orgId], references: [id])
  uploader  User         @relation("FileUploadedBy", fields: [uploadedBy], references: [id])
  bookings  Booking[]    @relation("BookingTicketFile")
  ocrJobs   OcrJob[]

  @@index([orgId, kind])
  @@index([orgId, uploadedBy])
  @@index([orgId, uploadedAt])
  @@index([deletedAt])
  @@map("files")
}

model OcrJob {
  id            String    @id @default(uuid())
  orgId         String
  fileId        String?
  bookingId     String?
  status        OcrStatus @default(PENDING)
  engine        String?
  extractedJson Json?
  errorMessage  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  org  Organization @relation(fields: [orgId], references: [id])
  file FileAsset?   @relation(fields: [fileId], references: [id])

  @@index([orgId, status])
  @@index([orgId, fileId])
  @@index([bookingId])
  @@map("ocr_jobs")
}

model AuditLog {
  id        String      @id @default(uuid())
  orgId     String
  actorId   String
  entity    String
  entityId  String
  action    AuditAction
  diff      Json
  ip        String
  userAgent String
  createdAt DateTime    @default(now())

  org   Organization @relation(fields: [orgId], references: [id])
  actor User         @relation("AuditActor", fields: [actorId], references: [id])

  @@index([orgId, entity, entityId])
  @@index([orgId, actorId, createdAt])
  @@index([orgId, createdAt])
  @@map("audit_logs")
}
```

## Data Migration Rules

### ID Strategy

- Preserve existing string IDs where possible.
- If old Mongo IDs are ObjectId strings, store them in the new UUID string fields only if all code accepts arbitrary strings. Otherwise create a legacy ID mapping table.
- Recommended optional table:

```prisma
model LegacyIdMap {
  id         String   @id @default(uuid())
  entity    String
  legacyId  String
  newId     String
  createdAt DateTime @default(now())

  @@unique([entity, legacyId])
  @@index([entity, newId])
  @@map("legacy_id_maps")
}
```

### Embedded Booking Split

Mongo booking records currently embed:

- `pax[]`
- `itineraries[]`
- `itineraries[].segments[]`

Postgres migration must split them:

- one row in `bookings`
- many rows in `booking_pax`
- many rows in `booking_itineraries`
- many rows in `booking_segments`

Preserve sequence numbers. Recompute derived fields after import and compare against source:

- `paxCount`
- `primaryPaxName`
- `travelStartAt`
- `travelEndAt`
- `paidAmount`
- `dueAmount`

### Money Reconciliation

After migration, run reconciliation reports:

- Sum receivables by booking equals booking paid amount, adjusted for outbound refunds.
- Booking due equals total minus paid where not fully refunded/cancelled, according to domain rules.
- Customer total spent equals booking/payment history expected total.
- Vendor total expense equals expense minus inbound refund history.
- Report totals match Mongo-era output for the same date range.

### Soft Delete and Archive

Map old flags:

- `isDeleted: true` -> keep `isDeleted = true` and set `deletedAt` if source timestamp exists or migration timestamp if not.
- `archivedAt` -> preserve as-is.
- Do not hard-delete during migration.

## Environment Model

Required target variables:

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=
DIRECT_URL=

REDIS_URL=redis://localhost:6379

AUTH_ACCESS_TOKEN_PRIVATE_KEY=
AUTH_ACCESS_TOKEN_PUBLIC_KEY=
AUTH_REFRESH_TOKEN_SECRET=
AUTH_ISSUER=travox
AUTH_ACCESS_TOKEN_TTL_SECONDS=900
AUTH_REFRESH_TOKEN_TTL_SECONDS=2592000
AUTH_ACCESS_COOKIE_NAME=travox-at
AUTH_REFRESH_COOKIE_NAME=refreshToken
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_ALLOWED_DOMAINS=

FILE_STORAGE_PROVIDER=local
FILE_STORAGE_ALLOW_LOCAL_FALLBACK=true
LOCAL_FILE_STORAGE_PATH=tmp/file-storage
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_SHARED_FOLDER_ID=

GEMINI_API_KEY=
LOG_LEVEL=info
```

Browser-safe variables:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_MAINTENANCE_ENABLED=false
NEXT_PUBLIC_MAINTENANCE_MESSAGE=
```

No database URL, JWT secret, refresh token secret, Google Drive secret, Gemini key, or Redis URL may use `NEXT_PUBLIC_`.

## Route Handler Pattern

Every route handler:

```text
parse request
validate params/query/body/formData with Zod
resolve ActorContext from cookies/session
call application use case
map result to DTO
return JSON or file response
map expected errors to status codes
log unexpected errors without secrets
```

No route handler may:

- Import Prisma.
- Import Mongoose.
- Import Redis concrete client.
- Import Google/Gemini SDKs.
- Build report rows.
- Calculate booking/payment business side effects.
- Decide authorization by role string directly.

## Server Action Pattern

Every server action:

```text
"use server"
validate input
resolve ActorContext
call the same use case used by route handlers
return typed action state
revalidate affected paths
redirect only after revalidation when needed
```

Use server actions for UI mutations:

- login/logout
- create/update/delete customer
- import customer CSV
- create/update/delete vendor
- create/update/status booking
- create receivable
- create expense
- create inbound refund
- create outbound refund
- create/update/archive account
- update user profile
- activate/deactivate user
- change role

Use route handlers for:

- API compatibility.
- Search endpoints.
- Table refresh endpoints.
- File uploads/downloads.
- OCR scans.
- Report data and exports.

## Permission Matrix

Initial permission codes:

```text
customers.read.any
customers.create.any
customers.update.any
customers.delete.any
customers.import.any
vendors.read.any
vendors.create.any
vendors.update.any
vendors.delete.any
bookings.read.any
bookings.create.any
bookings.update.any
bookings.delete.any
bookings.status.update.any
payments.read.any
payments.receivable.create.any
payments.expense.create.any
payments.refund.create.any
accounts.read.any
accounts.create.any
accounts.update.any
accounts.delete.any
reports.read.any
reports.export.any
files.read.any
files.upload.any
files.update.any
files.delete.any
files.download.any
ocr.scan.any
audit_logs.read.any
audit_logs.export.any
users.read.any
users.update.any
users.role.update.any
users.status.update.any
metrics.read.any
metrics.reset.any
```

Compatibility mapping:

- Owner gets every permission.
- Admin gets operational permissions for customers, vendors, bookings, payments, expenses, refunds, accounts, and reports.
- Audit logs, metrics reset, and user role/status management remain Owner-only unless product policy changes.

## Testing and Verification

### Per Phase

- Phase 1: build, typecheck, env validation, Prisma validate.
- Phase 2: auth route tests, cookie tests, permission tests.
- Phase 3: layout/navigation smoke tests.
- Phase 4: customer/vendor/account CRUD and search tests.
- Phase 5: booking validation and status transition tests.
- Phase 6: payment/refund transaction tests.
- Phase 7: report totals tests for every report ID.
- Phase 8: upload/download/OCR configured/unconfigured tests.
- Phase 9: audit and metrics tests.
- Phase 10: data reconciliation tests.

### End State

The migration is complete when:

- Every active UI route renders in Next.js.
- Every current Express endpoint has a Next route handler or documented replacement.
- Every UI mutation uses a server action or route handler that delegates to a use case.
- All protected use cases receive `ActorContext`.
- All authorization goes through the authorization module.
- Prisma is isolated to infrastructure.
- Supabase is treated as Postgres hosting, not as the core auth/authorization model.
- Mongo/Mongoose is removed from active production runtime or isolated as an optional adapter.
- Money workflows are transactional.
- Booking workflows preserve nested data and status rules.
- Report outputs match the current system for equivalent filters.
- File and OCR workflows work or fail gracefully when providers are missing.
- Audit logs are written for critical mutations.
- No active frontend imports React Router.
- No active frontend depends on `import.meta.env`.
- No browser token storage is required for normal auth.
- Build, typecheck, lint, unit, integration, and critical E2E checks pass.

## Recommended Execution Checklist

1. Create Next foundation.
2. Add Prisma schema and validate.
3. Add Supabase env and local migration workflow.
4. Add shared kernel.
5. Add auth and authorization.
6. Add protected shell.
7. Port accounts.
8. Port customers.
9. Port vendors.
10. Port bookings.
11. Port payments/expenses/refunds.
12. Port reports.
13. Port files/OCR.
14. Port audit/metrics.
15. Port users/admin.
16. Add data migration scripts.
17. Run reconciliation.
18. Switch repository provider to Prisma.
19. Retire Express API.
20. Retire Vite client.
21. Remove compatibility token/localStorage paths.
22. Final test and deployment hardening.

## Known Risks

- Booking form and booking aggregate are the largest functional migration.
- `GetReportData` is large and needs tests before refactoring.
- Money workflows currently rely on cache invalidation ordering; transaction boundaries must preserve correctness.
- Account links are business-critical because customers/vendors are inferred from accounts in payment workflows.
- Existing role model is simple; permission migration must preserve Owner/Admin behavior at first.
- Local file fallback is not durable in serverless deployments.
- OCR depends on optional Gemini configuration.
- Mongo embedded booking children require careful relational migration.
- Existing client/browser token compatibility should be removed only after cookie auth is fully proven.
