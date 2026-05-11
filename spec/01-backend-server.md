# Backend Migration Spec: Express Server to Next.js Clean Architecture

## Purpose

This document is the implementation plan for migrating the current Travox backend from the existing Express/TypeScript server in `server/` into the clean Next.js architecture described in `nextjs-architecture.md`.

The current backend already has useful separation between domain entities, application use cases, repository interfaces, Mongo repositories, cached repository wrappers, services, controllers, routes, and middleware. The migration should preserve that hard-won structure while moving delivery from Express controllers to Next.js route handlers and server actions, moving persistence from Mongo/Mongoose to Prisma/Supabase Postgres as the primary adapter, and keeping Mongo support only as an infrastructure adapter option.

The goal is not a mechanical file copy. The goal is to preserve behavior, invariants, data contracts, security posture, and operational workflows while making the code comply with the target modular monolith architecture.

## Target Architecture Rules

The migrated backend must follow these rules:

- Next.js is the delivery layer, not the architecture.
- Route handlers and server actions must validate input and delegate to use cases.
- Business logic must live in domain entities, domain services, application services, and use cases.
- Prisma must only be imported inside infrastructure.
- Mongoose or Mongo clients must only be imported inside infrastructure.
- Domain and application layers must not depend on Next.js, React, Express, HTTP, Prisma, Mongoose, Redis, Google APIs, Gemini, or file-system APIs.
- All protected use cases must receive an authenticated `ActorContext`.
- All protected use cases must call the internal authorization module for permission checks.
- Permission checks must replace scattered Owner/Admin role checks over time.
- All user input must be validated with Zod before entering use cases.
- Repository interfaces must return domain entities or DTO-safe application results, not persistence records.
- Persistence records must be mapped to domain entities and DTOs through mappers.
- Critical mutations must create audit logs.
- Business data must use soft delete by default.
- Secrets must never be exposed to browser bundles or logs.
- Server-only infrastructure modules must use `import "server-only"` where appropriate.

## Current Backend Inventory

The current backend is an Express 5 API written in TypeScript. The scanned server tree contains:

- Runtime bootstrap and Express app setup.
- Route registration for all product modules.
- Controllers for auth, accounts, audit logs, bookings, customers, files, metrics, OCR, payments, reports, users, and vendors.
- Domain entities for accounts, audit logs, bookings, booking itineraries, booking PAX, booking segments, customers, organizations, payments, users, and vendors.
- Application repository interfaces for all persistent modules.
- Application services for JWT, Google OIDC, and Google Drive.
- Application use cases for accounts, audit logs, auth, bookings, customers, files, payments/refunds/expenses, reporting, users, and vendors.
- Mongo/Mongoose model definitions and repository implementations.
- Redis cached repository wrappers for hot reads and report-related data.
- Middleware for auth, refresh tokens, audit logging, date parsing/serialization, request logging, and error handling.
- Integrations with Google OIDC, Google Drive/local storage fallback, Gemini OCR, Redis, Mongoose, Swagger, multer, pino, and CSV parsing.
- Scripts for Redis cache flushing.
- Legacy Firestore naming/types in some shared model files even though active persistence is MongoDB.

High-risk logic areas:

- Booking create/update/status flows.
- Receivable payments and overpayment prevention.
- Expense creation and vendor totals.
- Inbound and outbound refund side effects.
- Report generation and report cache keys.
- Customer and vendor booking reports.
- OCR extraction and conversion into booking-shaped data.
- File upload/download and storage fallback.
- Auth cookies, refresh tokens, and Google identity bootstrap.
- Cache invalidation before financial reads to avoid stale validation.

## Current Route Surface

The current Express route surface should be preserved as compatibility API paths unless a deliberate versioned API change is made.

### Auth

Current:

- `POST /auth/google`
- `POST /auth/logout`
- `POST /auth/refresh`

Target:

- `src/app/api/auth/google/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/refresh/route.ts`
- Server actions for UI login/logout where used by the Next frontend.

Migration notes:

- Keep Google OIDC verification behind an auth application use case.
- Set access and refresh cookies from route handlers or server actions.
- Store refresh tokens hashed in the target architecture.
- Support current cookie names during transition if old clients still call the API.

### Customers

Current:

- `POST /customers`
- `POST /customers/import`
- `GET /customers`
- `GET /customers/search`
- `GET /customers/report`
- `GET /customers/:id`
- `PUT /customers/:id`
- `GET /customers/:id/stats`
- `GET /customers/:id/bookings`
- `GET /customers/:id/account`
- `DELETE /customers/:id`

Target:

- `src/app/api/customers/route.ts`
- `src/app/api/customers/import/route.ts`
- `src/app/api/customers/search/route.ts`
- `src/app/api/customers/report/route.ts`
- `src/app/api/customers/[id]/route.ts`
- `src/app/api/customers/[id]/stats/route.ts`
- `src/app/api/customers/[id]/bookings/route.ts`
- `src/app/api/customers/[id]/account/route.ts`
- Customer server actions for create, update, import, and delete.

Migration notes:

- CSV import must use `request.formData()` and explicit file-size/type validation.
- Preserve customer account lookup behavior used by payments.
- Preserve customer cache invalidation after changes.

### Vendors

Current:

- `POST /vendors`
- `GET /vendors`
- `GET /vendors/search`
- `GET /vendors/report`
- `GET /vendors/:id`
- `PUT /vendors/:id`
- `GET /vendors/:id/stats`
- `GET /vendors/:id/account`
- `DELETE /vendors/:id`

Target:

- `src/app/api/vendors/route.ts`
- `src/app/api/vendors/search/route.ts`
- `src/app/api/vendors/report/route.ts`
- `src/app/api/vendors/[id]/route.ts`
- `src/app/api/vendors/[id]/stats/route.ts`
- `src/app/api/vendors/[id]/account/route.ts`
- Vendor server actions for create, update, and delete.

Migration notes:

- Preserve vendor service-type filtering.
- Preserve vendor account lookup behavior used by expenses.
- Preserve total expense and booking count side effects.

### Bookings

Current:

- `POST /bookings`
- `GET /bookings`
- `GET /bookings/search`
- `GET /bookings/filter`
- `GET /bookings/upcoming`
- `GET /bookings/overdue`
- `GET /bookings/revenue-stats`
- `GET /bookings/stats`
- `GET /bookings/travel-dates`
- `GET /bookings/:id`
- `PUT /bookings/:id`
- `PATCH /bookings/:id/status`
- `PATCH /bookings/:id/cancel`
- `PATCH /bookings/:id/confirm`
- `PATCH /bookings/:id/complete`
- `DELETE /bookings/:id`

Target:

- `src/app/api/bookings/route.ts`
- `src/app/api/bookings/search/route.ts`
- `src/app/api/bookings/filter/route.ts`
- `src/app/api/bookings/upcoming/route.ts`
- `src/app/api/bookings/overdue/route.ts`
- `src/app/api/bookings/revenue-stats/route.ts`
- `src/app/api/bookings/stats/route.ts`
- `src/app/api/bookings/travel-dates/route.ts`
- `src/app/api/bookings/[id]/route.ts`
- `src/app/api/bookings/[id]/status/route.ts`
- `src/app/api/bookings/[id]/cancel/route.ts`
- `src/app/api/bookings/[id]/confirm/route.ts`
- `src/app/api/bookings/[id]/complete/route.ts`
- Booking server actions for create, update, status transitions, cancel, confirm, complete, and delete.

Migration notes:

- Booking domain invariants are critical and should be ported before repository implementation.
- Status transition methods should remain in domain/application code, not route handlers.
- Preserve denormalized fields such as PAX count, primary PAX name, travel start, and travel end.

### Payments, Expenses, and Refunds

Current:

- `POST /payments/receivable`
- `POST /payments/expense`
- `POST /payments/inbound-refund`
- `POST /payments/outbound-refund`
- `GET /payments`
- `GET /payments/:id`

Target:

- `src/app/api/payments/route.ts`
- `src/app/api/payments/[id]/route.ts`
- `src/app/api/payments/receivable/route.ts`
- `src/app/api/payments/expense/route.ts`
- `src/app/api/payments/inbound-refund/route.ts`
- `src/app/api/payments/outbound-refund/route.ts`
- Server actions for create receivable, create expense, create inbound refund, and create outbound refund.

Migration notes:

- These workflows need transaction boundaries in the target architecture.
- Preserve cache invalidation before reads that validate money state.
- Preserve report cache invalidation after writes.

### Accounts

Current:

- `GET /accounts`
- `GET /accounts/:id`
- `POST /accounts`
- `PUT /accounts/:id`
- `DELETE /accounts/:id`
- `POST /accounts/:id/archive`

Target:

- `src/app/api/accounts/route.ts`
- `src/app/api/accounts/[id]/route.ts`
- `src/app/api/accounts/[id]/archive/route.ts`
- Account server actions for create, update, delete, and archive.

Migration notes:

- Account use cases are currently small but should gain org-scoped authorization checks.
- Delete/archive semantics must be clarified; soft archive should be preferred.

### Files and OCR

Current:

- `POST /files`
- `GET /files`
- `GET /files/:id`
- `GET /files/:id/download`
- `PUT /files/:id`
- `DELETE /files/:id`
- `POST /scan`
- `GET /scan`
- `GET /schema`

Target:

- `src/app/api/files/route.ts`
- `src/app/api/files/[id]/route.ts`
- `src/app/api/files/[id]/download/route.ts`
- `src/app/api/scan/route.ts`
- `src/app/api/schema/route.ts`
- File/OCR server actions only where used by forms; keep downloads and uploads as route handlers.

Migration notes:

- Replace multer with `request.formData()`.
- Preserve 50MB file limits unless product changes them.
- Preserve allowed OCR MIME types: JPEG/JPG, PNG, GIF, WebP, and PDF.
- Preserve local storage fallback behavior until a durable storage adapter is chosen.
- OCR must remain gracefully disabled when Gemini is not configured.

### Reports

Current:

- `GET /reports/catalog`
- `GET /reports/:reportId`
- explicit compatibility routes for supported report IDs.

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

Target:

- `src/app/api/reports/catalog/route.ts`
- `src/app/api/reports/[reportId]/route.ts`

Migration notes:

- Preserve catalog metadata and explicit report IDs.
- Move report ID parsing and filter normalization into presentation schemas/application DTO mappers.
- Keep report construction in application services/use cases.
- Preserve cache key normalization and 5-minute TTL behavior.

### Audit Logs and Metrics

Current:

- `POST /audit-logs`
- `GET /audit-logs`
- `GET /audit-logs/export`
- `GET /audit-logs/entity/:entity/:entityId`
- `GET /audit-logs/actor/:actorId`
- `GET /audit-logs/date-range`
- `GET /metrics`
- `POST /metrics/reset`

Target:

- `src/app/api/audit-logs/route.ts`
- `src/app/api/audit-logs/export/route.ts`
- `src/app/api/audit-logs/entity/[entity]/[entityId]/route.ts`
- `src/app/api/audit-logs/actor/[actorId]/route.ts`
- `src/app/api/audit-logs/date-range/route.ts`
- `src/app/api/metrics/route.ts`
- `src/app/api/metrics/reset/route.ts`

Migration notes:

- Audit and metrics surfaces are owner/permission protected.
- CSV export should stream or return a file response from a route handler.
- Metrics should operate through a cache metrics port rather than directly resolving Redis in presentation code.

### Users

Current:

- `GET /users`
- `GET /users/me`
- `PUT /users/me`
- `GET /users/:id`
- `PATCH /users/change-role`
- `PATCH /users/:id/activate`
- `PATCH /users/:id/deactivate`

Target:

- `src/app/api/users/route.ts`
- `src/app/api/users/me/route.ts`
- `src/app/api/users/change-role/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/users/[id]/activate/route.ts`
- `src/app/api/users/[id]/deactivate/route.ts`
- User and authorization server actions for profile update, role changes, activate, and deactivate.

Migration notes:

- Current Owner-only checks should become permission checks.
- Role changes must audit actor, target, old role, and new role.
- Protect against deactivating the last owner/admin equivalent.

## Target Module Plan

Create modules that match business boundaries:

```text
src/modules/
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
```

Each module should follow:

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
  redis/
  external/
presentation/
  actions/
  schemas/
  route-handlers/
  mappers/
```

Shared infrastructure and shared primitives:

```text
src/shared/
  domain/
    domain-error.ts
    result.ts
    unique-entity-id.ts
  application/
    actor-context.ts
    pagination.ts
    transaction-manager.ts
    clock.port.ts
    cache.port.ts
  infrastructure/
    database/prisma/
    cache/redis/
    logger/
    config/
  presentation/
    api-response.ts
    error-mapper.ts
    request-context.ts
    route-handler.ts
```

## Migration Strategy

### Phase 1: Establish Next Backend Foundation

Set up the backend foundation inside the Next app before moving product logic:

- Create `src/config/env.ts` using Zod.
- Create `src/shared/application/actor-context.ts`.
- Create shared error classes and an error-to-response mapper.
- Create route handler helpers for JSON responses, authenticated actor resolution, and request parsing.
- Create a dependency container suitable for serverless and long-running Next runtimes.
- Create a transaction manager port.
- Create cache port abstractions.
- Create logger port abstractions.
- Add Prisma client singleton in infrastructure with `import "server-only"`.
- Add Redis adapter in infrastructure with `import "server-only"`.
- Add test setup for domain/use-case tests.

### Phase 2: Port Domain and Application Logic Without Changing Persistence

Move current domain entities and use cases into module folders before switching databases:

- Move booking, PAX, itinerary, and segment domain behavior into the bookings module.
- Move customer and vendor entities into their modules.
- Move payment and account entities into payments/accounts modules.
- Move report result types and report generation into reports application services.
- Move file document concepts into files module.
- Move audit log entity/use cases into audit module.
- Keep old Mongo repositories temporarily as infrastructure adapters.

During this phase, preserve behavior and signatures where possible. Add DTO mappers at the presentation boundary so the UI does not receive domain objects directly.

### Phase 3: Convert Express Delivery to Next Delivery

Replace Express routes and controllers with Next route handlers:

- Each route handler parses request params/query/body.
- Each route handler validates with a Zod schema.
- Each route handler resolves `ActorContext`.
- Each route handler calls one use case.
- Each route handler maps the result to a safe response DTO.
- Each route handler maps expected errors to stable HTTP status codes.

For UI mutations, add server actions that call the same use cases as route handlers. Do not duplicate business logic between route handlers and server actions.

### Phase 4: Introduce Authorization Module

Replace direct role arrays with permission checks:

- Define permission codes for each resource/action/scope.
- Seed roles and permission assignments.
- Create authorization service.
- Add `requirePermission` application guard helpers.
- Update every mutation use case to receive `ActorContext`.
- Update every protected query use case to check permissions where required.
- Audit role/permission changes.

Initial permission groups:

- `customers.read.any`, `customers.create.any`, `customers.update.any`, `customers.delete.any`, `customers.import.any`
- `vendors.read.any`, `vendors.create.any`, `vendors.update.any`, `vendors.delete.any`
- `bookings.read.any`, `bookings.create.any`, `bookings.update.any`, `bookings.delete.any`, `bookings.status.update.any`
- `payments.read.any`, `payments.receivable.create.any`, `payments.expense.create.any`, `payments.refund.create.any`
- `accounts.read.any`, `accounts.create.any`, `accounts.update.any`, `accounts.delete.any`
- `reports.read.any`, `reports.export.any`
- `files.read.any`, `files.upload.any`, `files.update.any`, `files.delete.any`, `files.download.any`
- `ocr.scan.any`
- `audit_logs.read.any`, `audit_logs.export.any`
- `users.read.any`, `users.update.any`, `users.role.update.any`, `users.status.update.any`
- `metrics.read.any`, `metrics.reset.any`

### Phase 5: Migrate Persistence to Prisma/Supabase Postgres

After domain/application parity:

- Design Prisma schema for organizations, users, auth sessions, refresh tokens, customers, vendors, accounts, bookings, booking PAX, itineraries, segments, payments, files, audit logs, roles, permissions, user roles, and role permissions.
- Create migrations.
- Implement Prisma repositories per module.
- Implement persistence mappers.
- Implement transaction manager around multi-write money workflows.
- Port cache invalidation to repository/use-case boundaries.
- Seed initial organization, owner/admin user, roles, permissions, and default accounts if needed.
- Run data migration from Mongo to Postgres if existing data must be preserved.

### Phase 6: Retire Express Server

When route parity and data parity are confirmed:

- Remove Express app bootstrap.
- Remove Express controllers and route registration.
- Remove Express middleware.
- Remove Mongoose models from active runtime if Prisma is primary.
- Keep Mongo adapters only if the product explicitly needs a compatibility path.
- Remove Swagger Express setup or replace it with generated OpenAPI from route schemas if desired.
- Remove old Docker/Nginx/server deployment assumptions.

## Domain Migration Plan

### Organizations

Preserve:

- Organization ID scoping for all business records.
- Default organization assignment used by auth/user bootstrap.
- Repository lookup by ID.

Target:

- Organization entity in `organizations/domain`.
- Organization repository port.
- Prisma organization repository.
- ActorContext always includes `orgId`.

### Auth

Preserve:

- Google OIDC login.
- Access token and refresh token issuance.
- Access token cookie named `travox-at` during transition.
- Refresh token cookie compatibility during transition.
- Logout invalidates refresh token and clears cookies.
- Refresh endpoint rotates or renews tokens.
- JWT uses RS256 in current system.

Target:

- Auth user/session entities.
- Token service port and implementation.
- Google OIDC provider port and adapter.
- Refresh token repository storing hashed tokens.
- Cookie writer helpers in presentation.
- Server-only auth context resolver.
- Optional password auth only if introduced by the target architecture.

Migration tasks:

- Move Google verification into `auth/application/use-cases/google-login.use-case.ts`.
- Move logout into `logout.use-case.ts`.
- Move refresh into `refresh-session.use-case.ts`.
- Add Zod schemas for Google login and refresh requests.
- Add current actor resolver for route handlers/server components.
- Add audit logs for login success, login failure, logout, and refresh-token anomalies.

### Users and Authorization

Preserve:

- User lookup by email, Google ID, ID, and organization.
- Owner/Admin role behavior during compatibility phase.
- User activation/deactivation.
- Current user profile update.
- Owner-only access to user management in current UI.

Target:

- Users module owns user profile/status.
- Authorization module owns roles, permissions, assignments, and permission checks.
- Role changes are use cases, not controller logic.
- Permission checks happen in use cases.

Migration tasks:

- Split current user role logic into users and authorization modules.
- Create role and permission tables/entities.
- Map current `Owner` to highest admin role and current `Admin` to operational/admin role.
- Create permission seeding.
- Rewrite `ManageUserRoles` as assign/revoke/change role use cases.
- Protect self-deactivation and last-owner cases.

### Customers

Preserve:

- Customer create, update, search, advanced search, list, stats, account lookup, booking report, CSV import, soft delete, hard delete if explicitly used.
- Account association used to derive customer from payment `fromAccountId`.
- Total spent and booking count updates.
- Sensitive field masking/unmasking behavior.

Target:

- Customer entity and value objects.
- Customer repository port.
- Customer query use cases.
- Customer mutation use cases.
- CSV import use case.
- Customer report query use case or report module integration.
- DTO mappers for API and UI responses.

Migration tasks:

- Move customer validation into Zod schemas and domain methods.
- Replace controller-level request parsing with route handler schemas.
- Add transaction support for customer mutations that create/update related accounts.
- Preserve cache invalidation hooks after create/update/delete/import.

### Vendors

Preserve:

- Vendor create, update, search, list, stats, account lookup, booking report, soft delete/hard delete.
- Vendor total expense and booking count updates.
- Service type filtering.

Target:

- Vendor module with domain/application/infrastructure/presentation layers.
- Vendor report use cases can live in vendor or reports module, but should use DTO boundaries.

Migration tasks:

- Port vendor entity behavior.
- Port vendor repository interface.
- Implement Prisma vendor repository.
- Preserve vendor account lookup for expense creation.
- Add cache invalidation after changes.

### Bookings

Preserve:

- Booking creation with customer, currency, positive total, PAX, optional itineraries, optional vendor, optional advance amount.
- PAX validation: each PAX requires name and type.
- Itinerary validation: name and sequence number.
- Segment validation: mode and sequence number plus mode-specific rules.
- Flight requires departure code.
- Hotel requires hotel name.
- Train/bus require departure code or boarding point.
- Cab/other remain flexible.
- Derived fields: PAX count, primary PAX name, travel start, travel end.
- Status transitions: draft, confirmed, ticketed, in progress, completed, cancelled, refunded.
- Confirm requires at least one PAX.
- Ticket requires at least one travel segment.
- Complete requires travel ended and due amount zero unless admin override.
- Cancel, archive, soft delete.
- Booking count updates on related customer/vendor.
- Report cache invalidation after changes.

Target:

- Booking aggregate with child PAX, itinerary, and segment entities.
- Booking use cases for create, update, query, status transition, delete/archive.
- Booking repository port.
- Prisma persistence model using normalized child tables.
- Transaction manager for booking plus related customer/vendor count updates.

Migration tasks:

- Move mode-specific validation into booking domain service or value-object validators.
- Replace mutable `any` field updates with typed command DTOs.
- Add Zod schemas for create/update/filter/search/status.
- Preserve current API response shape through DTO mappers during compatibility.
- Add tests for every status transition and validation rule.

### Payments, Expenses, Refunds, and Accounts

Preserve:

- Receivable creation requires booking, positive amount, account, fresh booking state, and no overpayment.
- Receivable derives customer from source account.
- Receivable updates booking paid/due and customer total spent.
- Expense requires positive amount and destination account.
- Expense derives vendor from destination account and updates vendor total expense.
- Inbound refund finds original expense, derives vendor, reverses vendor expense total, and creates refund payment.
- Outbound refund finds original receivable, derives customer and booking, reduces customer total spent, and deducts booking paid amount/refund state.
- Cache invalidation before stale-sensitive reads.
- Report cache invalidation after writes.
- Account create, update, list, get, delete, archive.

Target:

- Payment domain entity with payment type value object.
- Separate use cases for receivable, expense, inbound refund, outbound refund.
- Account module for account lifecycle.
- Transaction manager around each multi-write money workflow.
- Money amount value object if feasible.

Migration tasks:

- Add transaction boundaries before switching persistence.
- Add idempotency strategy for money mutations if API retries are possible.
- Add tests for overpayment, refund reversal, customer/vendor total updates, and booking paid/due adjustments.
- Keep UI DTOs separate from persistence and ledger DTOs.

### Reports

Preserve:

- Report catalog.
- All supported report IDs.
- Filter normalization for date range, customer/vendor IDs, transaction types, payment modes, service types, pending-only, search, sort, include refunds/details/zero-balance, and booking ID.
- Base dataset loading from bookings, customers, vendors, receivables, outbound refunds, expenses, and inbound refunds.
- Customer timeline event ordering.
- Vendor timeline event ordering.
- Report row columns and metadata.
- 5-minute Redis cache TTL.
- Cache keys that include org, report ID, and normalized filters.
- GST view notes about missing legal-grade GST fields.

Target:

- Reports application service/use case.
- Report catalog DTOs.
- Report filter schemas at route boundary.
- Cache port for report result caching.
- Export route handlers if CSV/XLSX/PDF export is added.

Migration tasks:

- Move report construction logic into reports application services.
- Add unit tests for report row generation and totals.
- Avoid making report use cases depend on Prisma includes or relation shapes.
- Optimize Prisma repositories for base dataset loading.

### Files and OCR

Preserve:

- File metadata records.
- File uploads up to current limit.
- Download response with original filename and MIME type.
- Delete removes metadata and storage object.
- Update metadata.
- Google Drive upload/download/delete/metadata.
- Local storage fallback for missing/failed Drive configuration.
- OCR upload scan and fileId-based scan.
- OCR health endpoint.
- Schema reflection endpoint.
- Gemini config error behavior when missing API key.
- OCR-to-booking conversion behavior.

Target:

- Files module owns metadata and storage port.
- Storage adapters: Google Drive adapter, local adapter, future object storage adapter.
- OCR module owns OCR provider port and booking extraction use case.
- Gemini adapter lives under infrastructure external provider.
- Route handlers parse multipart form data.

Migration tasks:

- Replace multer with Web Request `formData`.
- Add explicit file validation schemas.
- Keep file buffers out of logs.
- Decide whether local fallback is allowed in production.
- Add tests for storage adapter selection and missing provider config.

### Audit Logs and Observability

Preserve:

- Audit create/query/export behavior.
- Entity, actor, date-range filters.
- Async audit capture for mutation responses.
- Cache metrics and reset behavior.
- Pino-style structured logging intent.
- Date parsing and serialization behavior.

Target:

- Audit service port used by use cases.
- Audit repository under audit module.
- Observability module for metrics.
- Logger port with Next-compatible implementation.
- Route-handler wrappers for request ID, structured logs, and error mapping.

Migration tasks:

- Replace Express audit middleware with explicit audit service calls inside mutation use cases.
- Add route wrapper for request logging and unexpected error capture.
- Preserve CSV export.
- Avoid putting sensitive metadata into audit details.

## Infrastructure Migration Plan

### Dependency Injection

Current:

- `tsyringe` container registers services and repository implementations by string token.

Target:

- A server-only dependency container under `src/container`.
- Prefer explicit factory functions or a lightweight DI registry compatible with Next server runtimes.
- Avoid request-global mutable state.
- Inject `ActorContext` per use-case call, not through singleton state.

Migration tasks:

- Create repository provider for Prisma-first or Mongo-compatible adapter selection.
- Create use-case factories.
- Keep all container code server-only.
- Decide whether to retain `tsyringe` or replace it with explicit factories.

### Persistence

Current:

- MongoDB connection configured by `MONGODB_URI` or individual Mongo env vars.
- Mongoose schemas map snake_case fields to camelCase domain objects.
- Repository implementations handle mapping and querying.

Target:

- Prisma Postgres primary persistence.
- Supabase Postgres managed database.
- Prisma models must not leak outside infrastructure.
- Mongo adapters can remain as optional infrastructure only.

Migration tasks:

- Draft relational schema.
- Create database constraints and indexes for org-scoped queries.
- Implement mappers for every aggregate.
- Add soft-delete filters by default.
- Add transactions for multi-write workflows.
- Create data migration scripts if preserving Mongo data.

### Redis and Caching

Current:

- Redis service exposes get/set/delete/deleteMany/invalidatePattern/invalidatePatterns/exists/getTTL/generateKey/generateListKey/metrics.
- Cached repositories wrap base Mongo repositories.
- Financial use cases invalidate caches before reads to prevent stale overpayment/refund decisions.

Target:

- Cache port in shared application layer.
- Redis adapter in infrastructure.
- Cache keys generated by module-specific cache key helpers.
- Use cases own invalidation intent where it is part of business correctness.

Migration tasks:

- Keep pre-read invalidation in receivable/refund workflows.
- Keep report invalidation patterns.
- Avoid tying use cases directly to Redis concrete class.
- Add tests for cache invalidation call order in money workflows.

### External Services

Current integrations:

- Google OIDC.
- Google Drive.
- Gemini OCR.
- Pino logger.
- Swagger.

Target:

- Provider ports in application layer.
- Concrete adapters under infrastructure.
- No provider SDK imports outside infrastructure.

Migration tasks:

- Create `GoogleIdentityProviderPort`.
- Create `FileStoragePort`.
- Create `OcrProviderPort`.
- Create `LoggerPort`.
- Replace Swagger comments with generated OpenAPI or route schema documentation if desired.

## Environment Migration

Map current environment to target validated env:

| Current variable | Target variable | Notes |
| --- | --- | --- |
| `PORT` | Next runtime config, usually not needed in app code | Next server owns port. |
| `CORS_ORIGIN` | Usually remove for same-origin Next app | Keep only for external API compatibility. |
| `MONGODB_URI` | `DATABASE_URL` / `DIRECT_URL` for Prisma | Keep Mongo env only for temporary adapter. |
| `MONGODB_*` | Mongo adapter-only env | Not required for Prisma-first runtime. |
| `REDIS_URL` | `REDIS_URL` | Validate with Zod. |
| `JWT_PRIVATE_KEY` | Auth token secret/private key config | Preserve RS256 or migrate deliberately to jose secret/key pair. |
| `JWT_PUBLIC_KEY` | Auth token public key config | Server-only. |
| `JWT_ISSUER` | `AUTH_ISSUER` | Server-only. |
| `ACCESS_TOKEN_LIFETIME` | `AUTH_ACCESS_TOKEN_TTL_SECONDS` or duration config | Normalize naming. |
| `REFRESH_TOKEN_LIFETIME` | `AUTH_REFRESH_TOKEN_TTL_SECONDS` or duration config | Normalize naming. |
| `COOKIE_DOMAIN` | `AUTH_COOKIE_DOMAIN` | Optional. |
| `COOKIE_SAME_SITE` | `AUTH_COOKIE_SAME_SITE` | Validate enum. |
| `OAUTH_CLIENT_ID` | `GOOGLE_OAUTH_CLIENT_ID` | Server-only unless browser Google UI needs public ID. |
| `OAUTH_ALLOWED_DOMAINS` | `GOOGLE_OAUTH_ALLOWED_DOMAINS` | Server-only. |
| `GDRIVE_CLIENT_ID` | `GOOGLE_DRIVE_CLIENT_ID` | Server-only. |
| `GDRIVE_CLIENT_SECRET` | `GOOGLE_DRIVE_CLIENT_SECRET` | Server-only. |
| `GDRIVE_REFRESH_TOKEN` | `GOOGLE_DRIVE_REFRESH_TOKEN` | Server-only. |
| `SHARED_FOLDER_ID` | `GOOGLE_DRIVE_SHARED_FOLDER_ID` | Server-only. |
| `FILE_STORAGE_PROVIDER` | `FILE_STORAGE_PROVIDER` | Validate values. |
| `FILE_STORAGE_ALLOW_LOCAL_FALLBACK` | `FILE_STORAGE_ALLOW_LOCAL_FALLBACK` | Usually false in production. |
| `LOCAL_FILE_STORAGE_PATH` | `LOCAL_FILE_STORAGE_PATH` | Server-only. |
| `GEMINI_API_KEY` | `GEMINI_API_KEY` | Server-only. |
| `LOG_LEVEL` | `LOG_LEVEL` | Server-only. |

Rules:

- Validate env at startup/import boundary.
- Never expose these values with `NEXT_PUBLIC_`.
- Keep server-only env modules out of client components.

## Presentation Boundary Rules

Every route handler should follow this shape:

```text
parse params/query/body/formData
validate with Zod
resolve ActorContext
authorize through use case or authorization service
call use case
map domain/application result to response DTO
return JSON/file response
map expected errors to stable HTTP responses
```

Every server action should follow this shape:

```text
"use server"
parse FormData or typed input
validate with Zod
resolve ActorContext
call use case
revalidate affected paths
return action state or redirect
```

Do not:

- Import Prisma into route handlers.
- Import Redis into route handlers.
- Import Google/Gemini SDKs into route handlers.
- Put report math, payment side effects, or booking transition rules in route handlers.
- Return domain entities directly.

## Error Handling Plan

Create shared errors:

- `ValidationError`
- `UnauthorizedError`
- `ForbiddenError`
- `NotFoundError`
- `ConflictError`
- `BusinessRuleViolationError`
- `ProviderConfigurationError`
- `ExternalProviderError`

Map to responses:

| Error | Status |
| --- | ---: |
| ValidationError | 400 |
| UnauthorizedError | 401 |
| ForbiddenError | 403 |
| NotFoundError | 404 |
| ConflictError | 409 |
| BusinessRuleViolationError | 422 |
| ProviderConfigurationError | 503 |
| Unknown error | 500 |

Preserve client-compatible response envelopes during transition:

```json
{
  "status": "success",
  "data": {}
}
```

and:

```json
{
  "status": "error",
  "data": {
    "message": "Human-readable error"
  }
}
```

The final architecture may move to a typed API response format, but compatibility should be kept until the frontend has migrated.

## Data Model Migration Plan

Prisma schema must support at minimum:

- organizations
- users
- auth credentials if password auth is added
- auth sessions / refresh tokens
- roles
- permissions
- user roles
- role permissions
- customers
- vendors
- accounts
- bookings
- booking passengers
- booking itineraries
- booking segments
- payments
- files
- audit logs

Important modeling notes:

- Every business table should include `orgId`.
- Add indexes for `orgId`, active/deleted status, search fields, booking status, booking customer/vendor IDs, payment type, payment booking/customer/vendor IDs, file kind, audit actor/entity/date, and report-heavy filters.
- Use soft delete columns such as `deletedAt` or `isDeleted` consistently.
- Preserve created/updated actor fields where the current system has them.
- Preserve account links used to infer customers/vendors for payments.
- Model booking child records relationally rather than embedding arrays.
- Use transactions for workflows that update payments plus booking/customer/vendor totals.

## Implementation Order

1. Create shared backend kernel: errors, result types, pagination, ActorContext, logger port, cache port, transaction manager port.
2. Create server-only env validation.
3. Create auth context resolver for Next route handlers/server actions.
4. Create route-handler helpers and response/error mappers.
5. Create dependency container/factory structure.
6. Port domain entities module by module.
7. Port application repository interfaces and use cases module by module.
8. Add Zod schemas for every current route input.
9. Add compatibility DTO mappers for current API response shapes.
10. Add Next route handlers for auth.
11. Add Next route handlers/server actions for customers.
12. Add Next route handlers/server actions for vendors.
13. Add Next route handlers/server actions for bookings.
14. Add Next route handlers/server actions for accounts.
15. Add Next route handlers/server actions for payments, expenses, and refunds.
16. Add Next route handlers for reports.
17. Add Next route handlers for files and OCR.
18. Add Next route handlers for audit logs and metrics.
19. Add Next route handlers/server actions for users and authorization.
20. Create Prisma schema.
21. Implement Prisma repositories and mappers.
22. Add transaction manager.
23. Switch module repositories from Mongo adapters to Prisma adapters one module at a time.
24. Add data migration scripts if needed.
25. Retire Express server once route parity, data parity, and UI migration are complete.

## Detailed Task Breakdown

### Foundation Tasks

- Create `src/shared/domain/domain-error.ts`.
- Create `src/shared/application/actor-context.ts`.
- Create `src/shared/application/cache.port.ts`.
- Create `src/shared/application/transaction-manager.ts`.
- Create `src/shared/application/logger.port.ts`.
- Create `src/shared/presentation/api-response.ts`.
- Create `src/shared/presentation/error-mapper.ts`.
- Create `src/shared/presentation/get-request-context.ts`.
- Create `src/config/env.ts`.
- Create `src/container/dependency-container.ts`.
- Create `src/shared/infrastructure/database/prisma/prisma.client.ts`.
- Create `src/shared/infrastructure/cache/redis-cache.adapter.ts`.
- Create `src/shared/infrastructure/logger/pino-or-console-logger.ts`.

### Auth and Authorization Tasks

- Port JWT token service.
- Port Google OIDC service.
- Add refresh token hashing.
- Add auth session repository.
- Add login/logout/refresh use cases.
- Add current actor use case.
- Add permission entities and repository.
- Add authorization service.
- Seed Owner/Admin compatibility roles.
- Add route/action auth wrappers.

### Module Port Tasks

For each business module:

- Move domain entity.
- Remove dependency on shared `FirestoreTypes` by creating module enums/value objects.
- Move repository interface.
- Move use cases.
- Add command/query DTOs.
- Add Zod schemas.
- Add response DTO mappers.
- Add Next route handlers.
- Add server actions for UI mutations.
- Add Prisma repository.
- Add Mongo adapter only if needed for transition.
- Add unit tests for domain/use cases.
- Add integration tests for repository behavior.

### Cross-Cutting Tasks

- Replace Express `requireAuth` with Next actor resolver and authorization service.
- Replace Express `auditLogger` middleware with audit service calls inside use cases.
- Replace Express `errorHandler` with route handler error mapper.
- Replace Express date parser/serializer with schema coercion and DTO serialization.
- Replace multer with `request.formData`.
- Replace Swagger Express setup with schema-driven API docs if needed.
- Replace Redis concrete use in use cases with cache port.
- Replace direct `process.env` reads in services with validated config.

## Acceptance Criteria

The backend migration is complete when:

- Every current Express endpoint has a Next route handler or documented replacement.
- UI mutations have server actions where appropriate.
- All route handlers and server actions validate input with Zod.
- All protected use cases receive `ActorContext`.
- All protected use cases authorize through the authorization module.
- No Prisma import exists outside infrastructure.
- No Mongoose/Mongo import exists outside infrastructure.
- No Google/Gemini/Redis SDK import exists outside infrastructure.
- Domain/application code does not import Next.js or React.
- Current business rules for bookings, payments, expenses, refunds, reports, files, OCR, audit logs, and users are preserved.
- Money workflows run inside transactions in the Prisma implementation.
- Report cache keys and invalidation behavior are preserved.
- File upload/download works with configured storage.
- OCR returns graceful configuration errors when Gemini is absent.
- Auth cookies are httpOnly, secure in production, and sameSite-configured.
- Refresh tokens are stored hashed in the target persistence layer.
- Audit logs are created for critical mutations.
- Build, typecheck, unit tests, integration tests, and relevant E2E smoke tests pass.

## Verification Plan

Minimum checks during migration:

- Typecheck after every module port.
- Unit tests for domain entities and use cases.
- Integration tests for repository mappers.
- Route handler tests for auth, validation, and error mapping.
- Transaction tests for receivable, expense, inbound refund, outbound refund, and booking update workflows.
- Report snapshot or totals tests for every supported report ID.
- File upload/download smoke tests.
- OCR configured and unconfigured smoke tests.
- Authorization tests for Owner/Admin compatibility and permission-based replacement.
- End-to-end smoke through the migrated Next UI after frontend and backend route parity.

For this documentation-only planning change, no executable build or test command is required.

## Known Risks

- `GetReportData` is large and should be ported with focused tests before refactoring internals.
- Current use cases depend directly on `RedisService`; this must become a cache port to satisfy clean architecture.
- Current repository interfaces import some enum types from legacy `FirestoreTypes`; module-owned enums/value objects should replace that dependency.
- Current controllers sometimes contain response-specific transformation and compatibility logic; this must move to presentation mappers.
- Current account repository methods are not consistently org-scoped by signature; migration should enforce org scoping.
- Current refresh token storage appears simple; target architecture requires hashed refresh tokens and rotation/revocation semantics.
- Current audit logging is middleware-driven; use-case-driven auditing is safer but requires careful coverage.
- File storage local fallback writes to local disk; this may not be durable in serverless deployment.
- Mongo-to-Postgres data migration will need explicit scripts and reconciliation checks if production data exists.
