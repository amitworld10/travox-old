# Travox Documentation Plan

## Goal

Create a reconstruction-grade documentation pack for the Travox repository so a future Codex agent or engineering team can understand the product, rebuild a similar system, and continue work with the same architecture and business rules.

## Scope

- Inventory the full repository structure, runtime architecture, deployment assets, and existing documentation.
- Document the React/Vite client, Express/TypeScript server, MongoDB/Mongoose persistence layer, Redis caching, Google auth/Drive integrations, OCR, reporting, and operational scripts.
- Create module-by-module specs under `spec/` with purpose, files, data contracts, workflows, API boundaries, frontend behavior, and rebuild notes.
- Create top-level `README.md` and `AGENTS.md` for humans and coding agents.
- Keep this plan and `tasks.md` updated after each documentation iteration.

## Iterations

### Iteration 1: Repository Discovery

Status: Completed

Findings:

- The repository is a full-stack travel management system named Travox.
- `client/` is a React 18 + Vite + Tailwind application with role-gated routes for customers, vendors, bookings, payments, expenses, refunds, reports, audit logs, and user access.
- `server/` is an Express 5 + TypeScript API using tsyringe dependency injection, MongoDB/Mongoose repositories, Redis-backed cached repositories, JWT/Google auth, audit logging, OCR, and reporting.
- Root deployment assets include Dockerfiles, Compose configuration, and CI/deploy YAML files.
- Existing docs include revamp notes, feature notes, and a prior deep analysis. The new docs should consolidate and update this into agent-friendly reconstruction specs.

### Iteration 2: Top-Level Documentation

Status: Completed

Deliverables:

- `README.md` with product overview, architecture, setup, environment variables, scripts, modules, API surface, operational notes, and known risks.
- `AGENTS.md` with repository-specific coding-agent instructions, architecture rules, workflows, testing guidance, and documentation maintenance rules.

Findings:

- The root now has a complete human-facing project guide and an agent-facing operating manual.
- The docs explicitly call out active modules, route surfaces, environment variables, deployment concerns, and known legacy drift.

### Iteration 3: Module Specs

Status: Completed

Deliverables:

- `spec/` directory at the repository root.
- Separate Markdown specs for each major product/technical module.
- Specs should be detailed enough to guide implementation of a similar product from scratch.

Generated specs:

- `spec/00-repository-map.md`
- `spec/01-backend-server.md`
- `spec/02-frontend-client.md`
- `spec/03-auth-users-rbac.md`
- `spec/04-customers.md`
- `spec/05-vendors.md`
- `spec/06-bookings.md`
- `spec/07-payments-expenses-refunds-accounts.md`
- `spec/08-reports-ledgers.md`
- `spec/09-files-ocr.md`
- `spec/10-audit-metrics-observability.md`
- `spec/11-deployment-operations.md`
- `spec/12-legacy-revamp-surface.md`

### Iteration 4: Consistency Review

Status: Completed

Deliverables:

- Review generated docs against code inventory.
- Confirm module list covers active and legacy surfaces.
- Record verification and limitations.

Review notes:

- Confirmed `spec/` contains 13 module/specification files.
- Confirmed root docs and specs reference the active client routes and backend route groups.
- Folded the repository Context7 documentation lookup rule into `AGENTS.md`.
- No source code was changed; this iteration created documentation only.
- Build/type/test commands were not run because the task was documentation-only and no executable code changed.

### Iteration 5: Functional Spec Rewrite

Status: Completed

Scope:

- Rewrote the module specs for auth/users/RBAC, customers, vendors, bookings, payments/expenses/refunds/accounts, reports/ledgers, files/OCR, and audit/metrics/observability.
- Removed file-path and architecture-coupled sections from those specs.
- Expanded each spec with functional behavior, UI controls, user journeys, validations, states, and acceptance criteria.

Review notes:

- Confirmed no `Backend Files`, `Frontend Files`, `server/src`, `client/src`, `.ts`, or `.tsx` references remain in the rewritten eight module specs.
- No executable code was changed.

### Iteration 6: Next.js Frontend Migration Plan

Status: Completed

Scope:

- Used Context7 MCP to verify current Next.js App Router migration guidance for layouts, client/server components, route handlers, loading UI, environment variables, middleware matchers, and server actions.
- Scanned the current `client/` tree file by file for active routes, Vite configuration, React Router dependencies, browser-only APIs, environment usage, shared UI primitives, feature screens, services, hooks, and legacy surfaces.
- Updated `AGENTS.md` with compact Next.js migration context so future agents can resume without replaying the full scan.
- Replaced `spec/02-frontend-client.md` with a complete migration implementation plan from the current React/Vite UI to the target `nextjs-architecture.md`.

Review notes:

- The frontend spec now includes target route mapping, target module structure, phased migration strategy, file classification, environment migration, shared UI plan, module-by-module behavior, detailed task breakdown, risks, and acceptance criteria.
- The plan preserves current UI behavior while moving toward server-side auth, permission-based access, route handlers, server actions, DTO boundaries, and clean module structure.
- No executable source code was changed.

### Iteration 7: Next.js Backend Migration Plan

Status: Completed

Scope:

- Used Context7 MCP to verify current Next.js backend delivery guidance for route handlers, server actions, redirects/revalidation, server-side environment variables, and App Router APIs.
- Scanned the current `server/` tree for runtime bootstrap, routes, controllers, domain entities, use cases, repository interfaces, Mongo/Mongoose implementations, cached repository wrappers, middleware, services, Swagger docs, scripts, and environment usage.
- Updated `AGENTS.md` with compact backend migration context so future agents can resume without replaying the server scan.
- Replaced `spec/01-backend-server.md` with a complete implementation plan for migrating Express backend logic to the target Next.js clean architecture.

Review notes:

- The backend spec now includes current endpoint inventory, target Next route handler mapping, target module structure, migration phases, domain-by-domain migration plan, infrastructure migration plan, environment mapping, implementation tasks, acceptance criteria, verification plan, and risks.
- The plan preserves current business rules around org scoping, bookings, payments, expenses, refunds, reports, cache invalidation, files, OCR, audit logs, auth, and user access.
- No executable source code was changed.

### Iteration 8: End-to-End Next.js Migration Spec

Status: Completed

Scope:

- Used Context7 MCP for current Prisma and Supabase guidance around PostgreSQL datasource configuration, `DATABASE_URL`, `DIRECT_URL`, relations, enums, indexes, UUID defaults, and migrations.
- Merged the backend and frontend migration plans into a single end-to-end migration guide.
- Added a module-by-module migration sequence covering UI, route handlers, server actions, use cases, infrastructure, and data migration.
- Added a Prisma/Supabase Postgres data model draft for organizations, users, auth identities, auth sessions, roles, permissions, accounts, customers, vendors, bookings, booking children, payments, files, OCR jobs, and audit logs.

Deliverable:

- `spec/13-end-to-end-nextjs-migration.md`

Review notes:

- The new spec is intended as the primary execution guide for migration to `nextjs-architecture.md`.
- `spec/01-backend-server.md` and `spec/02-frontend-client.md` remain as deeper backend/frontend source plans.
- No executable source code was changed.

### Iteration 9: Next.js Migration Execution Backlog

Status: Completed

Scope:

- Used the `next-best-practices` skill to anchor implementation planning in current App Router conventions.
- Used Context7 MCP for current Next.js App Router guidance, including `src/app` file conventions, server-only cookie/session helpers, and the Next 16 `proxy.ts` convention.
- Reviewed `spec/13-end-to-end-nextjs-migration.md` as the primary implementation plan.
- Confirmed the requested target workspace is the root `src/` folder.
- Converted the end-to-end migration phases into an execution backlog in `tasks.md`.

Review notes:

- `tasks.md` now tracks migration iterations 10 through 20, covering Phase 0 safety net through Phase 10 data migration and cutover.
- The execution backlog keeps migrated application files under root `src/`, with Prisma files under `prisma/` as specified by the migration plan.
- No executable source code was changed in this iteration.

### Iteration 10: Phase 0 Safety Net and Baseline

Status: Completed

Scope:

- Capture the current route, endpoint, environment, and workspace baseline before implementing the Next.js app.
- Preserve manual smoke coverage for the critical product workflows: login, customers, vendors, bookings, payments, expenses, refunds, reports, audit logs, users, files, and OCR.
- Decide whether the migration must support production Mongo data migration or only fresh Supabase/Postgres deployments.

Deliverable:

- `spec/14-nextjs-migration-baseline.md`

Findings:

- Root `src/` exists and is empty, so the Next.js migration can start cleanly there.
- Active UI route parity currently comes from `client/src/routes/routeConfig.tsx`.
- Express API parity currently comes from `server/src/api/routes`, with health and ping registered in `server/src/server.ts`.
- Current client variables use `VITE_*`; target browser-safe variables must move to `NEXT_PUBLIC_*`.
- Current server variables include Mongo, Redis, JWT, Google OIDC, Google Drive/local storage, Gemini OCR, cookie, CORS, and logging settings.
- Production data migration scope is still undecided. Until product direction is explicit, the implementation should keep the schema and cutover path migration-capable.

Review notes:

- No executable source code was changed in this iteration.
- `tasks.md` was updated to mark Iteration 10 complete and keep Iteration 11 as the next implementation phase.

### Iteration 11: Phase 1 Next.js Foundation

Status: Completed

Scope:

- Create the Next.js App Router foundation in root `src/`.
- Add root and protected layouts, route placeholders, API route-handler placeholders, global CSS, env validation, shared kernel contracts, dependency factories, and server-only infrastructure placeholders.
- Add the initial Prisma schema and validate it against the target Supabase/Postgres model.

Deliverables:

- Root `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `tailwind.config.ts`, and `postcss.config.mjs`.
- App Router shell under `src/app`, including root layout, redirect home page, login placeholder, protected layout, loading, not-found, route placeholders, and API route-handler placeholders.
- Shared migration contracts under `src/shared`, server/client environment validation under `src/config`, container placeholders under `src/container`, and a Next 16 `src/proxy.ts`.
- Initial Prisma/Postgres schema under `prisma/schema.prisma`.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run prisma:validate` passed when run with placeholder local `DATABASE_URL` and `DIRECT_URL` values.

Findings:

- `npm install` completed after approval and created the root dependency lockfile.
- npm reported 2 moderate audit vulnerabilities. They were not auto-fixed because forced audit remediation can introduce broad dependency changes and should be handled deliberately.
- Root linting is scoped to the new migration app and ignores legacy `client/` and `server/`, which already contain unrelated historical lint failures.

Review notes:

- Migrated application code was kept under root `src/` as requested.
- Business behavior is not ported yet; API placeholders intentionally return 501 until their module iterations replace them.

### Iteration 12: Phase 2 Auth and Authorization

Status: Completed

Scope:

- Port auth and authorization contracts into the target `src/modules` structure.
- Implement Google login, refresh, logout, current actor resolution, httpOnly cookie helpers, route handlers, and server actions.
- Add permission-based authorization primitives and Owner/Admin compatibility mapping.
- Replace protected-shell assumptions with server-resolved actor and permission-aware navigation.

Deliverables:

- `src/modules/authorization/domain/permissions.ts`
- `src/modules/authorization/domain/roles.ts`
- `src/modules/authorization/application/authorization-service.ts`
- `src/modules/authorization/application/navigation-permissions.ts`
- `src/modules/authorization/infrastructure/seed-permissions.ts`
- `src/modules/auth/application/**`
- `src/modules/auth/infrastructure/**`
- `src/modules/auth/presentation/**`
- Updated auth route handlers under `src/app/api/auth/**/route.ts`
- Updated protected layout and `src/proxy.ts` for auth-aware routing.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run prisma:validate` passed with placeholder local `DATABASE_URL` and `DIRECT_URL`.
- Runtime smoke: `GET /login` returned `200`.
- Runtime smoke: unauthenticated `GET /customers` returned `307` redirect to `/login`.
- Runtime smoke: `POST /api/auth/google` with a dummy token returned the expected `401` configuration error because `GOOGLE_OAUTH_CLIENT_ID` is not set.

Findings:

- Google ID tokens are verified with `jose` using Google's remote JWKS and the configured `GOOGLE_OAUTH_CLIENT_ID`.
- Access and refresh JWTs are signed with RS256 through `jose`; missing key configuration fails explicitly.
- Refresh tokens are stored as SHA-256 hashes through the auth session repository.
- The Prisma auth user repository seeds system roles and permissions during Google upsert so Owner/Admin compatibility is available before a separate seed script exists.
- Real Google sign-in was not exercised because this workspace does not have live Google OAuth/JWT key/database environment values configured.

Review notes:

- Auth route handlers now replace their migration placeholders. Other API routes remain explicit 501 placeholders until their module iterations.
- Protected pages now require an access cookie and server actor resolution.

### Iteration 12A: Supabase Prisma Auth Setup

Status: Completed

Scope:

- Configure the migrated auth flow to use the Supabase Postgres database through Prisma only.
- Push the current Prisma schema to the configured Supabase project.
- Add repeatable verification for the auth database tables required by Google login, refresh sessions, and permission bootstrap.

Deliverables:

- `.env` is configured locally with a pooled Supabase `DATABASE_URL`, direct/session `DIRECT_URL`, Google OAuth client values, JWT keys, and blank `GOOGLE_OAUTH_ALLOWED_DOMAINS` for local Gmail sign-in.
- `.env.example` now documents the Supabase pooled/direct Prisma URL shape.
- `scripts/verify-supabase-prisma.mjs`
- `package.json` scripts: `prisma:generate`, `prisma:push`, and `db:verify:supabase`.
- `src/shared/infrastructure/prisma/prisma-client.ts` now fails clearly if `DATABASE_URL` is missing.

Verification:

- `npx prisma db push --skip-generate` synced the schema to the configured Supabase Postgres database.
- `npm run db:verify:supabase` passed, confirming Prisma connectivity and required auth tables: organizations, users, auth identities, auth sessions, roles, permissions, user roles, and role permissions.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run prisma:validate` passed.

Findings:

- The login database path is Prisma-only; no Supabase client was added.
- Role and permission tables are intentionally empty until first successful Google login because `PrismaAuthUserRepository` seeds system roles and permissions inside the Google upsert transaction.
- `npm run prisma:generate` is currently blocked while the local Next dev server holds the generated Prisma query engine DLL open on Windows. The existing generated client remains usable, and the schema push/verification succeeded.

### Iteration 13: Phase 3 Shared Shell and Design System

Status: Completed

Scope:

- Port shared styling tokens, reusable UI primitives, and protected shell behavior into the root Next.js `src/` architecture.
- Replace the minimal protected layout with a server-fed, permission-aware shell and client-only widgets for browser interactions.
- Replace protected route placeholders with shell-aware module overview screens until each module's full UI is migrated.

Deliverables:

- Shared presentation primitives under `src/shared/presentation/components`: Button, Modal, Table, Pagination, Badge, Card, Spinner, Toast, SearchField, PageHeader, StatCard, and ModuleOverviewPage.
- Protected shell under `src/shared/presentation/shell`, including grouped navigation, breadcrumbs, command palette, quick actions, maintenance banner, dark mode, logout, and actor display.
- Updated `src/app/(protected)/layout.tsx` to resolve the actor on the server and pass only serializable navigation data into the client shell.
- Updated protected pages for customers, vendors, bookings, payments, expenses, refunds, reports, customer report, vendor report, audit logs, users, report runner, and quarantined legacy surfaces.
- Updated public maintenance environment support with `NEXT_PUBLIC_MAINTENANCE_DETAILS`.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Findings:

- Shell navigation now uses the server-resolved actor's permission list before rendering any route group.
- Interactive shell behavior is isolated to client components: pathname-aware breadcrumbs, command palette, quick actions, dark mode, maintenance dialog, toasts, and logout.
- Follow-up `next-best-practices` cleanup split presentation exports into `src/shared/presentation/components/server.ts` and `src/shared/presentation/components/client.ts`, so Server Components do not import a barrel that also exposes Client Components.
- Shell logout now uses the existing `logoutAction` Server Action passed from the protected layout; the route handler remains available for API compatibility.
- Dark mode no longer reads `localStorage` during the first client render, avoiding a stored-theme hydration mismatch.
- The `"use server"` auth action file now exports only async server actions; the previous non-action Zod export was removed to satisfy Next build rules.
- Full business UI for customers, vendors, accounts, bookings, finance, reports, files/OCR, audit logs, and metrics remains owned by Iterations 14 through 19.

### Iterations 14-20: Module Migration and Cutover

Status: Planned

UI migration rule:

- Every module iteration must migrate the active UI for the modules it touches, replacing the corresponding `src/app/(protected)` placeholder screens with usable Next.js UI.
- Do not mark a module iteration complete if only the domain, use cases, repositories, route handlers, or server actions were migrated.
- Each iteration should verify the migrated UI states and responsive layout alongside backend behavior.

Scope:

- Iteration 14 ports organizations, accounts, customers, vendors, and their active UI screens.
- Iteration 15 ports bookings and the active bookings UI.
- Iteration 16 ports payments, expenses, refunds, and their active UI screens/dialogs.
- Iteration 17 ports reports and the reporting center, runner, customer report, vendor report, and export UI.
- Iteration 18 ports files/OCR plus any active files/OCR UI; intentionally absent UI must be documented.
- Iteration 19 ports audit logs, metrics, observability, and their active owner-facing UI.
- Iteration 20 completes data migration, repository cutover, Express retirement, Vite retirement after UI parity, auth compatibility cleanup, and final verification.

Tracking rule:

- After each migration iteration, update both `tasks.md` and this plan with completed work, findings, blockers, verification results, and the next planned iteration.

## High-Level Rebuild Strategy

1. Build the backend first: domain classes, Mongoose schemas, repository interfaces, Mongo implementations, cached repository wrappers, auth services, middleware, controllers, and routes.
2. Build the client shell second. For the legacy architecture this means Vite, Tailwind, routing, auth page, API connector, role guards, layout, and common UI primitives. For the planned migration this means Next.js App Router, public/protected route groups, server-aware auth, protected layout, shared presentation primitives, route handlers, and server actions.
3. Implement business modules in dependency order: accounts, customers/vendors, bookings, payments/refunds/expenses, audit logs, reports, OCR/files, users/admin.
4. Add Docker/Compose deployment and operational scripts.
5. Add tests around domain invariants, route auth, payment/refund side effects, reporting totals, and cache invalidation.
