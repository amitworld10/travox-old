# Travox Documentation Tasks

## Iteration 1: Repository Discovery

- [x] List root files and directories.
- [x] Inventory client and server source files.
- [x] Inspect package scripts and dependencies.
- [x] Inspect server bootstrap, route registration, auth middleware, DI container, and MongoDB config.
- [x] Inspect client routing, auth guards, API connector, role access, and app context.
- [x] Inspect representative domain classes and business workflows.
- [x] Read existing analysis and deployment files.

## Iteration 2: Top-Level Documentation

- [x] Write `README.md`.
- [x] Write `AGENTS.md`.
- [x] Update this task file after completion.
- [x] Update `PLANS.md` after completion.

## Iteration 3: Module Specs

- [x] Create `spec/` directory.
- [x] Write architecture and repository map spec.
- [x] Write backend API/server spec.
- [x] Write frontend client spec.
- [x] Write auth/user/RBAC spec.
- [x] Write customers spec.
- [x] Write vendors spec.
- [x] Write bookings spec.
- [x] Write payments/expenses/refunds/accounts spec.
- [x] Write reports/ledgers spec.
- [x] Write files/OCR spec.
- [x] Write audit logs/metrics/observability spec.
- [x] Write deployment/operations spec.
- [x] Write legacy/revamp notes spec.
- [x] Update this task file after completion.
- [x] Update `PLANS.md` after completion.

## Iteration 4: Review

- [x] Review generated docs for file/path accuracy.
- [x] Check module coverage against route and source inventory.
- [x] Record known limitations and recommended next steps.
- [x] Final update to `PLANS.md`.
- [x] Final update to this task file.

## Iteration 5: Functional Spec Rewrite

- [x] Remove file-path sections from auth/users/RBAC spec.
- [x] Remove file-path sections from customers spec.
- [x] Remove file-path sections from vendors spec.
- [x] Remove file-path sections from bookings spec.
- [x] Remove file-path sections from payments/expenses/refunds/accounts spec.
- [x] Remove file-path sections from reports/ledgers spec.
- [x] Remove file-path sections from files/OCR spec.
- [x] Remove file-path sections from audit/metrics/observability spec.
- [x] Add detailed functional UI behavior and workflows to all eight specs.
- [x] Verify no architecture/file-path references remain in the rewritten specs.
- [x] Update `PLANS.md` and `tasks.md`.

## Iteration 6: Next.js Frontend Migration Plan

- [x] Use Context7 MCP for current Next.js App Router migration guidance.
- [x] Read `nextjs-architecture.md`.
- [x] Scan the full `client/` tree for route, component, service, hook, config, and legacy-surface inventory.
- [x] Identify React Router, Vite env, browser storage, browser API, Axios, and Firebase migration hazards.
- [x] Preserve compact migration context in `AGENTS.md`.
- [x] Rewrite `spec/02-frontend-client.md` as a complete migration implementation plan.
- [x] Include active route mapping from current SPA routes to App Router files.
- [x] Include target module/folder structure.
- [x] Include shared UI migration tasks.
- [x] Include module-by-module migration behavior for auth, customers, vendors, bookings, payments, expenses, refunds, reports, audit logs, users, and legacy surfaces.
- [x] Include acceptance criteria, known risks, and verification plan.
- [x] Update `PLANS.md` and `tasks.md`.

## Iteration 7: Next.js Backend Migration Plan

- [x] Use Context7 MCP for current Next.js route handler and server action guidance.
- [x] Read `nextjs-architecture.md` for backend clean-architecture constraints.
- [x] Scan the full `server/` tree for source, config, route, controller, use-case, repository, middleware, service, model, script, and Swagger inventory.
- [x] Identify current Express route surface and target App Router API route mapping.
- [x] Identify domain/application logic that must be preserved during migration.
- [x] Identify Mongo/Mongoose, Redis, Google OIDC, Google Drive, Gemini OCR, multer, Swagger, and Express middleware migration hazards.
- [x] Preserve compact backend migration context in `AGENTS.md`.
- [x] Rewrite `spec/01-backend-server.md` as a complete backend migration implementation plan.
- [x] Include module-by-module migration plan for auth, users, authorization, customers, vendors, bookings, payments, accounts, reports, files, OCR, audit logs, metrics, and organizations.
- [x] Include persistence migration plan from Mongo/Mongoose to Prisma/Supabase Postgres.
- [x] Include environment migration, route-handler rules, error handling, implementation order, acceptance criteria, risks, and verification plan.
- [x] Update `PLANS.md` and `tasks.md`.

## Iteration 8: End-to-End Next.js Migration Spec

- [x] Use Context7 MCP for Prisma schema and Supabase Postgres connection guidance.
- [x] Review `spec/01-backend-server.md`.
- [x] Review `spec/02-frontend-client.md`.
- [x] Review current Mongo/shared model fields needed for the Prisma data model.
- [x] Create a new combined migration file in `spec/`.
- [x] Merge frontend route migration and backend API migration into one execution plan.
- [x] Add module-by-module frontend, backend, and database migration details.
- [x] Add Supabase/Prisma setup guidance using `DATABASE_URL` and `DIRECT_URL`.
- [x] Add initial Prisma schema draft for the migrated Postgres data model.
- [x] Add data migration rules for IDs, embedded booking children, money reconciliation, soft delete, and archives.
- [x] Add final acceptance criteria and execution checklist.
- [x] Update `PLANS.md` and `tasks.md`.

## Iteration 9: Next.js Migration Execution Backlog

- [x] Use `next-best-practices` for current App Router execution rules.
- [x] Use Context7 MCP for current Next.js App Router guidance before planning implementation.
- [x] Review `spec/13-end-to-end-nextjs-migration.md`.
- [x] Confirm the target migration workspace is root `src/`.
- [x] Convert the end-to-end migration spec into an iteration-by-iteration implementation backlog.
- [x] Update `PLANS.md` and `tasks.md`.

## Iteration 10: Phase 0 Safety Net and Baseline

- [x] Capture current root, `client/`, `server/`, and empty `src/` state.
- [x] Capture current React Router route inventory from `client/src/routes/routeConfig.tsx`.
- [x] Capture current Express route inventory from `server/src/api/routes`.
- [x] Capture current environment variables from README, server bootstrap, client env usage, and migration specs.
- [x] Add or document manual smoke scripts for login, customers, vendors, bookings, payments, expenses, refunds, reports, audit logs, users, files, and OCR.
- [x] Identify whether production data needs a Mongo-to-Postgres migration or whether new deployments can start fresh.
- [x] Create `spec/14-nextjs-migration-baseline.md`.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 11: Phase 1 Next.js Foundation in `src/`

- [x] Add root Next.js project configuration without moving migrated code outside `src/`.
- [x] Add App Router files under `src/app`: root layout, root redirect page, global CSS, loading, not-found, public login route, and protected layout placeholders.
- [x] Add route placeholders for all active protected UI routes listed in `spec/13-end-to-end-nextjs-migration.md`.
- [x] Add initial route-handler placeholders under `src/app/api/**/route.ts` for the Express parity surface.
- [x] Add `src/config/env.ts` with server/client environment validation and no secret exposure through `NEXT_PUBLIC_`.
- [x] Add `src/shared` kernel types for result/error handling, pagination, actor context, logging, cache, and transaction ports.
- [x] Add `src/container` dependency factories and repository provider placeholders.
- [x] Add server-only infrastructure placeholders for Prisma and Redis.
- [x] Add `prisma/schema.prisma` from the migration spec and validate it.
- [x] Verify with the smallest available foundation checks: Next build/typecheck, lint, and Prisma validation.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 12: Phase 2 Auth and Authorization

- [x] Port auth domain/application contracts into `src/modules/auth`.
- [x] Port authorization permissions, roles, and permission-checking services into `src/modules/authorization`.
- [x] Implement Google login, refresh, logout, and current actor use cases with hashed refresh sessions.
- [x] Implement auth route handlers and server actions using httpOnly cookies.
- [x] Add Owner/Admin compatibility permission seed data.
- [x] Replace UI auth assumptions with server-resolved actor state and permission DTOs.
- [x] Add Prisma-backed auth user and auth session repositories.
- [x] Add Google ID token verification through Google JWKS.
- [x] Verify build, typecheck, lint, Prisma validation, public login page, protected redirect, and expected missing-config auth error.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 12A: Supabase Prisma Auth Setup

- [x] Use the `supabase` skill and Context7 documentation for Supabase/Prisma setup guidance.
- [x] Configure `.env` for Prisma-only Supabase Postgres access with pooled `DATABASE_URL` and direct/session `DIRECT_URL`.
- [x] Keep Google sign-in domain restrictions blank locally so Gmail accounts are not rejected by `GOOGLE_OAUTH_ALLOWED_DOMAINS`.
- [x] Push the Prisma schema to the configured Supabase database with `npx prisma db push --skip-generate`.
- [x] Add repeatable npm scripts for Prisma generation, schema push, and Supabase auth database verification.
- [x] Add `scripts/verify-supabase-prisma.mjs` to verify Supabase connectivity and required auth tables through Prisma only.
- [x] Add a clear Prisma database setup error when `DATABASE_URL` is missing.
- [x] Verify Prisma-only Supabase connectivity and auth table presence.
- [x] Verify lint, typecheck, and Prisma schema validation.
- [x] Update `PLANS.md`, `tasks.md`, and `AGENTS.md` after completion.

## Iteration 13: Phase 3 Shared Shell and Design System

- [x] Port global styles, assets, and design tokens into `src/app` and `src/shared/presentation`.
- [x] Port active UI primitives: Button, Modal, Table, Pagination, Badge, Card, Spinner, Toast, SearchField, PageHeader, and StatCard.
- [x] Port protected layout shell, sidebar groups, breadcrumbs, command palette, quick actions, maintenance banner, and dark mode.
- [x] Replace shell-owned route placeholders with migrated UI, not placeholder-only screens.
- [x] Add current actor/navigation permission DTO flow for the shell.
- [x] Verify protected shell rendering, permission-aware navigation, desktop layout, and mobile layout.
- [x] Apply `next-best-practices` cleanup: split server/client presentation exports, remove theme hydration mismatch, and use a server action for shell logout.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 14: Phase 4 Master Data Modules

- [x] Port organizations, accounts, customers, and vendors domain/application layers under `src/modules`.
- [x] Add Prisma repositories, mappers, Zod schemas, route handlers, and server actions for accounts, customers, and vendors.
- [x] Migrate the active UI for every module touched in this iteration, replacing the relevant `src/app/(protected)` placeholders.
- [x] Port customers list/search/table/stats/bookings modal/create-edit/import/report entry UI.
- [x] Port vendors list/search/table/stats/create-edit/report entry UI.
- [x] Port account lookup/create/update/archive UI needed by customer, vendor, payment, and expense workflows.
- [x] Preserve org scoping, soft delete, masked sensitive fields, and account links.
- [x] Verify customer/vendor/account CRUD, search, report entry points, UI states, responsive layout, and totals preservation.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 15: Phase 5 Bookings

- [x] Port booking aggregate, PAX, itinerary, and segment domain rules.
- [x] Add create, update, list, search, filters, upcoming, overdue, travel dates, stats, revenue stats, soft delete, and status transition use cases.
- [x] Add Prisma booking repositories and mappers for relational booking child tables.
- [x] Add booking route handlers and UI server actions.
- [x] Migrate the active bookings UI, replacing the booking placeholder route.
- [x] Port booking management view, filters, nested form state, customer lookup, table actions, and status actions.
- [x] Verify booking validation, nested round trips, status transitions, derived fields, customer/vendor booking counts, UI states, and responsive layout.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 16: Phase 6 Payments, Expenses, and Refunds

- [x] Port receivable, expense, inbound refund, and outbound refund workflows.
- [x] Add transaction manager boundaries around every multi-write money workflow.
- [x] Preserve cache invalidation ordering and report cache invalidation after writes.
- [x] Add route handlers and server actions for payment workflows.
- [x] Migrate the active payments, expenses, and refunds UI, replacing all three placeholder routes.
- [x] Port payments, expenses, and refunds UI screens and dialogs.
- [x] Verify overpayment prevention, customer spend changes, vendor expense changes, booking paid/refunded state, UI states, responsive layout, and reports after writes.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 17: Phase 7 Reports

- [x] Port report catalog, `GetReportData`, customer report, and vendor report.
- [x] Add report filter schemas, DTO mappers, cache port, TTL, normalized cache keys, and a root Next cache adapter.
- [x] Migrate the active reports UI, replacing report center, report runner, customer report, and vendor report placeholders.
- [x] Port reporting center, report runner, customer report, vendor report, and export/download route handlers.
- [x] Add report-heavy indexes to the Prisma schema where needed.
- [x] Verify every supported report ID, filters, exports, totals, report UI states, responsive layout, and invalidation after booking/payment/refund changes.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 18: Phase 8 Files and OCR

- [x] Port file metadata use cases and storage port.
- [x] Add Google Drive and local storage adapters behind infrastructure boundaries.
- [x] Replace multer behavior with route-handler `request.formData()` handling and explicit file validation.
- [x] Port OCR provider port, Gemini adapter, scan-by-upload, scan-by-file, and schema reflection.
- [x] Migrate any active files/OCR UI owned by this product surface, replacing placeholders or documenting intentionally absent UI.
- [x] Keep legacy ticket upload quarantined unless explicitly requested.
- [x] Verify upload, download, delete, OCR configured flow, OCR unconfigured error flow, UI states, and responsive layout where UI exists.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 19: Phase 9 Audit Logs, Metrics, and Observability

- [x] Replace Express audit middleware with use-case audit calls.
- [x] Port audit log queries and CSV export.
- [x] Port cache metrics and reset through the cache port.
- [x] Add route-handler logging and expected-error mapping wrappers.
- [x] Migrate the active audit logs UI and any owner-only metrics UI owned by this product surface.
- [x] Port audit log UI and owner-only metrics surface if still product-owned.
- [x] Verify critical mutation audit logs, audit filters/export, metrics read/reset, UI states, and responsive layout.
- [x] Update `PLANS.md` and `tasks.md` after completion.

## Iteration 20: Phase 10 Data Migration and Cutover

- [ ] Add Mongo export scripts.
- [ ] Add transformation scripts from Mongo JSON into Prisma-compatible batches.
- [ ] Add legacy ID mapping strategy for ObjectIds or non-UUID identifiers.
- [ ] Split embedded booking PAX, itineraries, and segments into relational rows.
- [ ] Add reconciliation checks for booking paid/due/refunded values, customer spend, vendor expense, and report totals.
- [ ] Switch the active repository provider to Prisma.
- [ ] Disable Mongo adapters in production.
- [ ] Retire the Express upstream API after parity checks pass.
- [ ] Confirm every active Vite UI route has a migrated Next UI replacement before retiring the Vite client.
- [ ] Retire the Vite client after UI route parity checks pass.
- [ ] Remove compatibility browser token/localStorage auth paths.
- [ ] Run final build, typecheck, lint, unit, integration, responsive UI, and critical E2E checks.
- [ ] Update `PLANS.md` and `tasks.md` after completion.
