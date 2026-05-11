# AGENTS.md

Repository-specific instructions for Travox. Follow the user request first, then these rules.

## Project

Travox is a travel agency management system with a React/Vite frontend and Express/TypeScript backend. It manages customers, vendors, bookings, payments, expenses, refunds, accounts, reports, OCR-assisted file extraction, audit logs, and user access.

## Documentation Lookup

Use Context7 MCP for current docs whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service, including React, Vite, Express, Mongoose, Redis, Google APIs, Tailwind, Docker, Next.js, Prisma, or Supabase.

1. Call `resolve-library-id` with the library name and the full question unless the user gives an exact `/org/project` ID.
2. Choose the best match by exact name, relevance, snippets, reputation, and benchmark score.
3. Call `query-docs` with the selected ID and the full question.
4. Answer or implement from the fetched docs.

Do not use Context7 for pure refactoring, scripts from scratch, Travox business-logic debugging, code review, or general programming concepts.

## Core Architecture

- Preserve backend layers:
  - domain: `server/src/domain`
  - repository interfaces: `server/src/application/repositories`
  - use cases: `server/src/application/useCases`
  - controllers: `server/src/api/controllers`
  - routes: `server/src/api/routes`
  - Mongo repositories: `server/src/infrastructure/repositories/mongodb`
  - Mongoose schemas: `server/src/models/mongoose`
- Use `tsyringe` DI and register new bindings in `server/src/config/container.ts`.
- Keep controllers thin; validation and side effects belong in use cases or domain entities.
- Keep Mongo/Mongoose mapping in repositories. Do not leak documents or raw query shapes into domain/use-case code.
- Preserve `orgId` scoping for all business reads/writes.
- Preserve existing soft-delete fields such as `isDeleted` and `archivedAt`.
- Cached repositories must invalidate affected keys before writes where stale reads could affect totals.
- Preserve sensitive-field masking unless explicitly unmasked through the existing helper.

## Frontend

- Active routes live in `client/src/routes/routeConfig.tsx`.
- Protected Vite routes go through guards in `client/src/App.tsx`.
- API calls should use `client/src/utils/apiConnector.ts` or existing service patterns.
- Owner/Admin module access is controlled in `client/src/utils/roleAccess.ts`.
- Prefer existing UI under `client/src/components/ui` and `client/src/design-system`.
- Do not revive legacy dashboard, ledgers, calendar, settings, or ticket modules unless requested.

## Business Rules

- Bookings require `customerId`, `currency`, positive `totalAmount`, and at least one PAX.
- Booking PAX requires `paxName` and `paxType`.
- Segment minimums: `FLIGHT` needs `depCode`; `HOTEL` needs `hotelName`; `TRAIN`/`BUS` need `depCode` or `boardingPoint`; `CAB`/`OTHER` are flexible.
- Booking statuses: `Draft`, `Confirmed`, `Ticketed`, `In Progress`, `Completed`, `Cancelled`, `Refunded`.
- Receivable payments must not exceed booking `dueAmount`; they update booking paid/due and customer total spent.
- Expenses are outbound vendor/operational payments and require a destination account.
- Inbound refunds reverse vendor expenses and reduce vendor totals.
- Outbound refunds reverse receivables, reduce customer total spent, and adjust linked booking paid/refunded state.
- Reports derive from bookings, customers, vendors, and payments; cache keys include filters and `orgId`.
- Audit logs are required for critical mutations and must not include secrets or raw tokens.

## Auth And Security

- `requireAuth()` accepts access tokens from `Authorization: Bearer` or the `travox-at` cookie.
- Owner-only APIs must use `requireAuth([UserRole.OWNER])`.
- Google sign-in uses `OAUTH_CLIENT_ID` and optional `OAUTH_ALLOWED_DOMAINS`.
- JWT signing uses RS256 with `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`.
- Access and refresh cookies are httpOnly; the client also stores access tokens for bearer compatibility.
- Never log secrets, JWTs, refresh tokens, Google tokens, Mongo URIs with passwords, or uploaded file contents.

## Docs And Verification

- When adding/changing modules, update the relevant `spec/` file.
- Keep `README.md`, this file, `PLANS.md`, and `tasks.md` aligned when planned documentation or migration work changes.
- Documentation pack: `README.md`, `spec/`, `PLANS.md`, `tasks.md`.
- Use the smallest verification set that covers the change.
- Client checks: `cd client && npm run build`, `cd client && npm run lint`, `cd client && npm run typecheck`.
- Server checks: `cd server && npm run build`, `cd server && npm run typecheck`, `cd server && npm test`.
- If a change affects money, auth, reports, or cache invalidation, add tests when feasible.

## Cautions

- Some files retain Firestore naming/comments while active persistence is MongoDB.
- The server Dockerfile includes a legacy Firestore index deployment step.
- Legacy frontend modules may not be route-active or type-clean.
- Do not delete legacy code as cleanup unless explicitly requested.
- Do not revert unrelated user changes in a dirty worktree.

## Next.js Migration

Target architecture: Next.js App Router modular monolith with React, TypeScript, Prisma/Supabase Postgres, internal auth/RBAC, Clean Architecture, Ports/Adapters, DTOs, boundary mappers, server actions, route handlers, and server-only infrastructure. The target is described in `nextjs-architecture.md`.

### Next Facts

- App Router requires `src/app/layout.tsx` with `<html>` and `<body>`.
- Existing stateful UI can migrate first as client components with `"use client"`.
- Server components should fetch safe DTOs and pass them to client components.
- Route handlers live in `src/app/api/**/route.ts` and export HTTP methods.
- Server actions use `"use server"` and should validate input, commonly with Zod.
- Route-level `loading.tsx` files provide instant loading states.
- Server secrets stay in normal env vars; browser-safe values use `NEXT_PUBLIC_`.
- Middleware/proxy matchers should exclude `/api`, `/_next/static`, `/_next/image`, and `favicon.ico`.

### Supabase/Postgres

- The migrated app uses Supabase Postgres through Prisma only. Do not introduce Supabase client login or database access unless explicitly requested.
- Runtime DB access uses `DATABASE_URL`; Prisma schema changes use `DIRECT_URL`.
- Root commands: `npm run prisma:push`, `npm run prisma:generate`, `npm run db:verify:supabase`.
- `scripts/verify-supabase-prisma.mjs` verifies live Prisma connectivity and required auth tables for Google login.
- Keep `GOOGLE_OAUTH_ALLOWED_DOMAINS` blank locally unless restricting by email domain. Do not put `localhost` there.
- On Windows, stop the local Next dev server before `npm run prisma:generate` if Prisma cannot replace `node_modules/.prisma/client/query_engine-windows.dll.node`.

### Active Route Map

- `/` -> redirect to `/login` or default protected page.
- `/customers` -> `src/app/(protected)/customers/page.tsx`
- `/customers/report` -> `src/app/(protected)/customers/report/page.tsx`
- `/vendors` -> `src/app/(protected)/vendors/page.tsx`
- `/vendors/report` -> `src/app/(protected)/vendors/report/page.tsx`
- `/bookings` -> `src/app/(protected)/bookings/page.tsx`
- `/payments` -> `src/app/(protected)/payments/page.tsx`
- `/expenses` -> `src/app/(protected)/expenses/page.tsx`
- `/refunds` -> `src/app/(protected)/refunds/page.tsx`
- `/reports` -> `src/app/(protected)/reports/page.tsx`
- `/reports/:reportId` -> `src/app/(protected)/reports/[reportId]/page.tsx`
- `/logs` -> `src/app/(protected)/logs/page.tsx`
- `/users` -> `src/app/(protected)/users/page.tsx`
- `/legacy/:surface` -> `src/app/(protected)/legacy/[surface]/page.tsx`

### Frontend Migration Hazards

- `App.tsx` owns BrowserRouter, guards, session-expired modal, lazy routes, and mobile warning; split these into root layout, route groups, middleware, and protected shell.
- `Layout.tsx` owns sidebar groups, breadcrumbs, command palette, quick actions, dark mode, logout, and maintenance banner; migrate to protected shell plus client shell widgets.
- Current auth stores bearer tokens and user JSON in local/session storage; target is httpOnly cookies and server-side actor resolution. Browser token compatibility is temporary only.
- Replace `apiConnector.ts` with server-only API gateways, server actions, route handlers, and a small browser fetch wrapper only where needed.
- Replace `import.meta.env` with server `process.env` or browser-safe `NEXT_PUBLIC_*`.
- `window`, `document`, storage, exports/downloads, resize listeners, and quick-action events require client components.
- Firebase exists only in legacy ticket upload surfaces; do not promote it unless requested.

### Migration Phases

1. Create a Next shell and route parity while Express remains upstream.
2. Port shared CSS/assets/UI primitives and active pages as client components.
3. Replace React Router guards with route groups, protected layout, server cookie checks, middleware, and internal permission checks.
4. Introduce `src/modules/*/{domain,application,infrastructure,presentation}`.
5. Replace browser API calls with route handlers/server actions delegating to use cases.
6. Move backend behavior into Next clean architecture modules with Prisma isolated to infrastructure.

Detailed frontend plan: `spec/02-frontend-client.md`. Update it, `PLANS.md`, and `tasks.md` when the plan changes.

### Mandatory UI Rule

Every Next.js module migration iteration must include the active UI for touched modules. Do not finish an iteration with only domain/application/infrastructure/API/server-action work; replace the relevant `src/app/(protected)` placeholder with usable migrated UI. Verify desktop/mobile layout, loading/empty/error states, permission-aware visibility, and main workflows. If a module has no active UI, document that in `PLANS.md` and `tasks.md`.

### Iteration 13 Shell Status

- Protected shell: `src/shared/presentation/shell/ProtectedShell.tsx`, fed by `src/app/(protected)/layout.tsx`.
- Shell navigation is server-filtered through `getShellNavigationForActor()`.
- Shared UI primitives: `src/shared/presentation/components`.
- Server Components import from `src/shared/presentation/components/server`; Client Components import from `src/shared/presentation/components/client`. Do not cross RSC boundaries with a mixed barrel.
- Shell-owned UI mutations should prefer Server Actions from the server layout; keep route handlers where API compatibility is needed.
- Protected pages currently use `ModuleOverviewPage`; replace those with active UI in Iterations 14-19.

## Backend Next.js Migration

Target delivery is Next.js App Router with Clean Architecture, Prisma/Supabase Postgres first, and future Mongo only through infrastructure adapters.

### Current Backend Inventory

- Runtime: Express 5, TypeScript, `tsyringe`, MongoDB/Mongoose, Redis, JWT RS256, Google OIDC, Google Drive/local file fallback, Gemini OCR, Swagger, multer, pino.
- Entry points: `server/src/index.ts` validates env and connects Mongo; `server/src/server.ts` installs middleware, health/ping, Swagger, routes, and error handling.
- Routes: auth, customers, vendors, bookings, payments, audit logs, users, accounts, files, OCR scan/schema, metrics, reports.
- Existing layers: domain entities, repository interfaces, use cases, Mongo repositories, cached wrappers, services, Express controllers, middleware.
- Largest logic: `GetReportData`, booking flows, payment/expense/refund side effects, reports, OCR conversion, file upload/download, Redis invalidation.

### Route-To-Next Intent

- Express controllers become compatibility guides; final route handlers live under `src/app/api/**/route.ts`.
- UI mutations should become server actions under `src/modules/*/presentation/actions`.
- Use cases move to `src/modules/*/application/use-cases`.
- Repository interfaces move to module domain/application ports.
- Mongo/Mongoose implementations remain temporary infrastructure adapters; primary target is Prisma/Postgres.
- Auth middleware becomes server auth helpers, authorization service calls, route-handler wrappers, and use-case audit services.
- Multer uploads become `request.formData()`/Blob/Buffer handling with explicit size/type validation.
- Redis cache behavior becomes an application cache port; preserve race-condition protections for bookings, payments, refunds, customers, vendors, and reports.

Detailed backend plan: `spec/13-end-to-end-nextjs-migration.md`. Keep `AGENTS.md`, `PLANS.md`, and `tasks.md` synchronized when it changes.
