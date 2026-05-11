# Frontend Migration Spec: React/Vite Client to Next.js App Router

## Purpose

This document is the implementation plan for migrating the current Travox operator UI from the existing `client/` React/Vite single-page application into the clean Next.js architecture described in `nextjs-architecture.md`.

The plan is based on a full scan of the client source tree, including active routes, shared UI components, feature management screens, services, hooks, environment usage, browser-only behavior, and legacy surfaces. It is written so a Codex agent can rebuild the current UI in the target architecture without depending on the current folder layout.

The migration goal is functional parity first, architectural compliance second, and deeper full-stack consolidation third. The UI should continue to support customers, vendors, bookings, payments, expenses, refunds, reports, audit logs, users, role-gated navigation, session expiry handling, dark mode, quick actions, maintenance banners, export actions, modals, tables, filters, and forms.

## Target Architecture Rules

The migrated frontend must follow the rules from `nextjs-architecture.md`:

- Use Next.js App Router with route groups for public and protected areas.
- Use React server components by default.
- Mark interactive views with `"use client"` only where required.
- Keep business logic out of React components, route handlers, and server actions.
- Validate all mutation input before calling use cases.
- Delegate server actions and route handlers to application use cases.
- Use DTOs between application, route handlers, server components, and client components.
- Do not expose Prisma models or infrastructure records to UI code.
- Keep Prisma, Supabase, external HTTP clients, secrets, and adapters inside infrastructure modules.
- Use permission checks through the authorization module rather than scattered role comparisons.
- Use httpOnly cookies for auth. Browser token storage is allowed only as a temporary compatibility bridge during phased migration.
- Put module UI under module `presentation` folders and shared UI under shared `presentation`.

## Current Client Inventory Summary

The current UI is a React 18 + Vite + Tailwind + React Router + Axios app. The important scanned areas are:

- Application shell: bootstrap, browser router, auth guards, role guards, session-expired handling, mobile warning.
- Layout shell: sidebar, grouped navigation, breadcrumbs, command palette, quick actions, dark mode, maintenance banner, logout.
- Shared UI: buttons, cards, badges, modals, tables, pagination, spinners, toast helpers, account modal, design-system primitives, page headers, stat cards, search fields.
- Active modules: auth, customers, vendors, bookings, payments, expenses, refunds, reports, audit logs, users.
- Transitional or inactive modules: dashboard, ledgers, calendar, settings, ticket uploads, chart-heavy legacy reports.
- Services and utilities: API connector, audit-log service, user service, role access, timezone helpers, generic search hooks, toast helpers.
- Configuration: Vite config, Tailwind config, TypeScript configs, Vercel config, Docker/Nginx files, public brand assets.

Large interactive surfaces that require special migration care:

- Booking management and booking form are the largest active UI workflows and combine filters, customer search, nested segment/PAX state, modal state, payment-related calculations, and backend calls.
- Customer and vendor forms are large modal workflows with validation, edit/create modes, and related report navigation.
- Customer and vendor reports are large filter/export/reporting views.
- Payment, expense, and refund management combine money forms, account selection, filters, mutations, and table refreshes.
- The protected layout coordinates many global UI behaviors and should be migrated before active feature pages.

## Route Migration Map

The Next.js app should preserve the user-facing route structure as much as possible.

| Current route | Target route file | Notes |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Redirect to `/login` for guests or default protected page for authenticated users. |
| Auth page at `/` | `src/app/(public)/login/page.tsx` | Prefer explicit `/login`; keep root redirect for compatibility. |
| `/customers` | `src/app/(protected)/customers/page.tsx` | Customer list, search, stats, create/edit/view bookings. |
| `/customers/report` | `src/app/(protected)/customers/report/page.tsx` | Customer report workflow. |
| `/vendors` | `src/app/(protected)/vendors/page.tsx` | Vendor list, search, create/edit. |
| `/vendors/report` | `src/app/(protected)/vendors/report/page.tsx` | Vendor report workflow. |
| `/bookings` | `src/app/(protected)/bookings/page.tsx` | Booking operations surface. |
| `/payments` | `src/app/(protected)/payments/page.tsx` | Receivable payment surface. |
| `/expenses` | `src/app/(protected)/expenses/page.tsx` | Outbound expense surface. |
| `/refunds` | `src/app/(protected)/refunds/page.tsx` | Customer/vendor refund surface. |
| `/reports` | `src/app/(protected)/reports/page.tsx` | Reporting center. |
| `/reports/:reportId` | `src/app/(protected)/reports/[reportId]/page.tsx` | Dynamic report runner. Redirect known legacy IDs to specific report pages where needed. |
| `/logs` | `src/app/(protected)/logs/page.tsx` | Owner-only audit log screen. |
| `/users` | `src/app/(protected)/users/page.tsx` | Owner-only user administration. |
| `/legacy/:surface` | `src/app/(protected)/legacy/[surface]/page.tsx` | Placeholder/quarantine route for inactive surfaces. |

## Target Folder Plan

Recommended Next.js structure:

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
      expenses/
      refunds/
      reports/
      audit-logs/
      users/
  modules/
    auth/
    authorization/
    customers/
    vendors/
    bookings/
    payments/
    expenses/
    refunds/
    reports/
    audit-logs/
    users/
    accounts/
    files-ocr/
    legacy/
  shared/
    domain/
    application/
    infrastructure/
    presentation/
  container/
  config/
  tests/
```

Each business module should use:

```text
domain/          Pure entities, value objects, policy concepts.
application/     Use cases, DTOs, ports, validators.
infrastructure/  Database/API adapters, persistence mappers, server-only gateways.
presentation/    Next pages helpers, client views, forms, tables, UI adapters.
```

## Migration Strategy

### Phase 1: Next Shell and Functional Parity

Create a new Next.js app structure while preserving the existing Express API as the temporary upstream service. This phase should minimize product risk:

- Add Next.js, React, TypeScript, Tailwind, lint/build config, and App Router structure.
- Move static brand assets into the Next `public/brand` folder.
- Move global CSS into `src/app/globals.css`.
- Port shared UI primitives and design-system components.
- Port the login screen and protected shell.
- Port active route pages as thin App Router pages.
- Keep feature management views as client components initially.
- Replace React Router navigation with Next `Link`, `useRouter`, `usePathname`, and route params.
- Replace `react-hot-toast` usage only if the target UI library requires it; otherwise keep the toast behavior for parity.

### Phase 2: Auth and Access Control

Replace browser-owned auth with server-aware auth:

- Store access/refresh credentials in secure httpOnly cookies.
- Resolve the current actor on the server before protected pages render.
- Use a protected route group layout to redirect unauthenticated users.
- Use middleware for coarse guest/protected redirects only.
- Use application-level permission checks for module access.
- Keep an optional temporary browser compatibility adapter only if existing API calls still require a bearer token.
- Replace role-only UI checks with permission-driven navigation.

### Phase 3: API Boundary

Convert browser API calls into clean Next boundaries:

- Replace the generic Axios connector with module-specific application ports.
- Add server-only upstream API gateways if the Express API remains temporarily active.
- Add route handlers for table refreshes, search endpoints, export endpoints, and compatibility JSON calls.
- Add server actions for create, update, delete, refund, payment, and user-management mutations.
- Validate all action input with Zod before invoking use cases.
- Return typed action results with field errors, form errors, success payloads, and refresh hints.

### Phase 4: Module Clean Architecture

Move UI module by module into the target module structure:

- Extract DTOs from current implicit response shapes.
- Define module use cases around user actions rather than current component methods.
- Move table/query state into presentation adapters.
- Keep calculations that affect money, booking status, reports, or permissions inside application/domain use cases.
- Add mappers at infrastructure boundaries.
- Keep UI components focused on rendering controls, collecting input, and displaying use-case results.

### Phase 5: Full-Stack Consolidation

After UI parity is stable:

- Move backend use cases into the Next modular monolith.
- Add Prisma repositories under infrastructure.
- Add Supabase Postgres migrations and generated Prisma client.
- Retire Express-only client compatibility paths.
- Remove browser token storage.
- Remove Vite, React Router, Axios-only connector, old Nginx config, and SPA deployment files.

## File Classification Plan

### Replace Completely

These concepts are Vite/SPA-specific and should not survive as application architecture:

- Browser entrypoint mounting.
- HTML shell file.
- Vite config and Vite environment typings.
- React Router route config and route guard wrappers.
- Nginx SPA fallback config.
- Vite-specific Vercel routing.
- Browser-owned auth bootstrap.

Next.js equivalents:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- route group layouts
- file-system pages
- middleware/proxy redirect checks
- server-side actor resolution
- route handlers and server actions

### Port With Adaptation

These should move into the Next tree with targeted changes:

- Global CSS and Tailwind theme tokens.
- Brand assets.
- Shared UI primitives.
- Design-system primitives and shell widgets.
- Feature management screens.
- Form modals.
- Tables.
- Pagination.
- Search controls.
- Toast helpers.
- Timezone and formatting utilities.
- Export/download helpers.

### Quarantine as Legacy

These surfaces exist in the client tree but are not part of the active route set. Keep them isolated until a product decision is made:

- Dashboard charts and trend widgets.
- Ledger screens.
- Calendar screens.
- Settings screens.
- Ticket upload/Firebase-related flows.
- Old chart-heavy report widgets not linked from active navigation.

They can live under a `legacy` module and should not influence the clean architecture of active modules.

## Environment Migration

Current client values use Vite-style names. Replace them as follows:

| Current concept | Next target | Exposure |
| --- | --- | --- |
| API base URL | `TRAVOX_API_BASE` during transition | Server-only |
| Google client ID | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if used by browser Google UI | Public |
| Token storage key | Prefer no public env; use cookie names in server auth config | Server-only |
| User storage key | Remove after cookie-backed actor resolution | None |
| Maintenance enabled/message | Server config or `NEXT_PUBLIC_MAINTENANCE_*` if rendered client-side | Public only if harmless |

Rules:

- Never expose API secrets, JWT secrets, refresh token names, database URLs, or upstream internal URLs with `NEXT_PUBLIC_`.
- Use a Zod-validated env module.
- Put server-only env access behind `import "server-only"`.

## Shared UI Migration

### Protected Layout Shell

The protected shell must provide:

- Sidebar navigation grouped by Operations, Finance, Reporting, and Administration.
- Module visibility filtered by permissions.
- Active route highlighting.
- Mobile/tablet behavior equivalent to the existing unsupported-device warning or a deliberate responsive replacement.
- Breadcrumbs derived from route segments and known module labels.
- Command palette opened by keyboard shortcut.
- Quick actions for common create flows.
- Dark mode toggle and persisted preference.
- Maintenance banner.
- Logout action.
- Session-expired modal or redirect feedback.

Implementation notes:

- The protected layout should be a server component that validates the actor and passes a safe actor DTO to a client shell.
- The sidebar, command palette, quick actions, dark-mode state, and session modal should be client components.
- Logout should be a server action or route handler that clears cookies, then redirects to `/login`.
- The old hidden dark-mode unlock can be preserved for parity or intentionally replaced with an explicit setting.

### UI Primitives

Port these primitives before feature screens:

- Button with variants and loading/disabled states.
- Modal with focus management and Escape/backdrop behavior.
- Table wrapper with loading, empty, and row-action states.
- Pagination with stable layout and accessible controls.
- Badge/status pill component.
- Card/stat component.
- Spinner/loading indicator.
- Search field.
- Toast presentation and helper functions.
- Form field styles and validation messages.

All primitives should avoid importing business modules. Client-only primitives should be explicitly marked with `"use client"`.

## Module-by-Module UI Migration

### Auth

Functional behavior to preserve:

- Login screen supports email/password-style credentials or current supported sign-in modes.
- Google sign-in must remain available if configured.
- Successful login redirects authenticated users to the default protected module.
- Failed login displays a clear form-level error.
- Public login page should redirect away if the actor is already authenticated.
- Session expiry should clear local UI state and return the user to login with a message.

Next implementation:

- Public route page renders an auth client form.
- Login mutation calls a server action or route handler.
- The server action validates input, calls auth use case, sets httpOnly cookies, and returns redirect/success state.
- Google auth should use a server boundary for token verification.

### Customers

Functional behavior to preserve:

- Customer list with search, table, loading state, empty state, and pagination/refresh behavior.
- Create customer quick action opens the customer form modal.
- Edit action opens the same modal with existing values.
- Form includes customer identity, contact details, travel/business fields, and validation errors.
- Customer bookings modal shows related bookings for a selected customer.
- Customer report link opens the report surface.
- Customer totals and recent activity indicators should remain visible if currently available from the API.

Next implementation:

- Server page checks customer permission and fetches initial customer DTOs where practical.
- Client management component owns modal/search/table interaction.
- Mutations use server actions with Zod validation.
- Table refresh can use route handlers during transition, then use use cases directly.

### Vendors

Functional behavior to preserve:

- Vendor list with search, table, loading, empty, and row actions.
- Create/edit vendor modal.
- Vendor contact and commercial fields.
- Vendor report navigation.
- Vendor status and financial summary display where available.

Next implementation:

- Mirror the customer migration pattern.
- Keep vendor-specific DTOs separate from customer DTOs even where fields overlap.
- Ensure vendor search and report filters are URL-compatible for shareable views.

### Bookings

Functional behavior to preserve:

- Booking list with filters, search, refresh, loading, empty state, and table actions.
- Create booking quick action opens the booking form.
- Booking form supports customer search/selection, currency, totals, PAX entries, travel segments, mode-specific segment fields, booking status, and notes.
- Customer search dropdown remains keyboard/mouse usable and handles loading/no-result states.
- Form validation must preserve required fields and mode-specific requirements.
- Edit/view flows should not lose nested PAX or segment data.
- Booking status, paid amount, due amount, refunded amount, and payment-related displays must remain consistent with backend results.

Next implementation:

- Initially port booking management, booking form, booking form hook, filters, customer dropdown, and booking UI types as client presentation code.
- Move booking validation rules into application validators/use cases instead of keeping them only in client hooks.
- Keep nested form state local during the first pass, then move submit normalization into a presentation adapter.
- Use server actions for create/update/cancel workflows.
- Use route handlers for customer search and filter refreshes until direct use-case calls are available.

### Payments

Functional behavior to preserve:

- Payment list/table for receivable payments.
- Create payment quick action.
- Payment form selects customer/booking/account where applicable.
- Amount validation prevents invalid or excessive payment submissions.
- Successful payment refreshes the payment table and affected booking/customer totals.
- Errors are shown at the form or field level.

Next implementation:

- Server page fetches initial payment/account lookup DTOs.
- Client component owns modal and table state.
- Server action validates payment request and calls payment use case.
- Never calculate authoritative paid/due totals in UI; display returned DTOs.

### Expenses

Functional behavior to preserve:

- Expense list/table with filters and loading states.
- Create expense quick action.
- Expense form captures vendor/booking/category/account/amount/date/notes as supported.
- Expense submission refreshes related vendor/account/report data.

Next implementation:

- Use server actions for create/update/delete where available.
- Keep account and vendor lookup data as DTOs.
- Keep money validation in application layer.

### Refunds

Functional behavior to preserve:

- Refund list/table.
- Create refund dialog.
- Support refund direction/type distinctions used by the product.
- Validate refund amount against the source transaction or booking state.
- Refresh affected payment, booking, customer, vendor, and account views after mutation.

Next implementation:

- Port the dialog as a client component first.
- Move refund eligibility logic to application use cases.
- Keep UI responsible for choosing the refund target and displaying use-case validation messages.

### Reports

Functional behavior to preserve:

- Reporting center displays available reports and launches report runner pages.
- Dynamic report runner resolves report IDs.
- Customer booking report and vendor booking report preserve filters, date ranges, table states, totals, and export actions.
- Export actions download the expected file format.
- Empty, loading, error, and no-filter-result states remain clear.

Next implementation:

- Server pages can read search params and fetch initial report DTOs.
- Filter forms are client components that update URL search params.
- Exports should use route handlers so files stream from the server.
- Known report IDs that now have first-class pages should redirect to their canonical routes.

### Audit Logs

Functional behavior to preserve:

- Owner-only log list.
- Filters/search where currently available.
- Detail modal for selected audit event.
- Empty state and loading state.
- Human-readable formatting of actor, action, target, timestamp, metadata, and severity/status.

Next implementation:

- Server page checks audit-log permission.
- Client table opens a detail modal.
- Metadata formatting remains presentation-only; access decisions stay server-side.

### Users and Access

Functional behavior to preserve:

- Owner-only user management.
- User list, search/filter, create/invite/edit/deactivate workflows as currently supported.
- Role display and role assignment.
- Form validation and backend errors.
- Current user should not accidentally remove their own required owner access.

Next implementation:

- Server page checks user-management permission.
- Use application-level authorization for all mutations.
- Prefer permission/role DTOs over raw role strings.
- Server actions should return typed field errors and form errors.

### Legacy Surfaces

Functional behavior to preserve only for compatibility:

- `/legacy/[surface]` should display a clear placeholder or mounted legacy view if explicitly enabled.
- Dashboard, ledgers, calendar, settings, ticket uploads, Firebase upload flows, and older chart widgets should not block migration of active modules.

Next implementation:

- Keep legacy UI under a legacy module.
- Do not import Firebase or chart-heavy legacy dependencies into the main protected layout unless the surface is enabled.
- Add a product decision task before fully migrating each legacy surface.

## Browser-Only Behavior Checklist

Mark these components or wrappers as client components:

- Form components with controlled state.
- Modals and dropdowns.
- Tables with client sorting/filtering/pagination.
- Command palette.
- Quick actions.
- Dark-mode toggles.
- Toast host.
- Download/export buttons that use `window` or `document`.
- Components using `localStorage`, `sessionStorage`, resize listeners, keyboard listeners, or custom browser events.
- Legacy chart/export surfaces.

Server-safe components:

- Static page wrappers.
- Initial data loaders.
- Permission-checked page entrypoints.
- Layout shells that only pass DTO props.
- Read-only formatting components that do not use browser APIs.

## API and Data Flow Target

Preferred data flow after migration:

```text
Server page / server action / route handler
  -> application use case
  -> application port
  -> infrastructure adapter
  -> mapper
  -> DTO
  -> server component or client component
```

Temporary transition data flow:

```text
Next server boundary
  -> server-only upstream API gateway
  -> existing Express API
  -> normalized DTO
  -> client feature component
```

Avoid this long term:

```text
Browser component
  -> generic Axios connector
  -> arbitrary backend response
  -> business logic in component
```

## Dependency Migration

Add or prepare:

- `next`
- `server-only`
- `zod`
- `jose` or the auth library chosen by the target architecture
- `@prisma/client` and `prisma` when backend consolidation starts
- `argon2` when internal password auth moves into the Next monolith
- `uuid`
- `lucide-react`
- `react-hot-toast` or selected toast replacement
- `clsx`, `tailwind-merge`, and optionally `class-variance-authority`
- `react-hook-form` if forms are refactored during migration
- `@tanstack/react-table` if table behavior is standardized

Remove after parity:

- `vite`
- Vite plugins.
- `react-router-dom`
- Browser-only Axios API connector if all requests move to server boundaries.
- Vite-specific TypeScript config.

## Tailwind and Styling Plan

- Move global styles to `src/app/globals.css`.
- Preserve Tailwind base/components/utilities.
- Preserve CSS variables for color, radius, shadow, dark mode, and form styling.
- Update Tailwind content globs to include App Router, modules, and shared folders.
- Prefer `next/font/google` for the current font rather than CSS `@import` if practical.
- Preserve form utility classes used by large modal forms.
- Verify dark mode after moving layout state.

## Implementation Order

1. Create Next.js project files and install dependencies.
2. Add root layout, public login route, protected route group, global CSS, Tailwind config, and brand assets.
3. Implement env validation and server-only config.
4. Implement auth cookie helpers, actor DTO, middleware/protected layout checks, and logout.
5. Port shared UI primitives and toast host.
6. Port protected layout shell with navigation, breadcrumbs, command palette, quick actions, maintenance banner, dark mode, and session expiry handling.
7. Create all active App Router pages as placeholders with permission checks.
8. Port Auth.
9. Port Customers.
10. Port Vendors.
11. Port Bookings.
12. Port Payments.
13. Port Expenses.
14. Port Refunds.
15. Port Reports and export route handlers.
16. Port Audit Logs.
17. Port Users.
18. Add legacy placeholder route.
19. Replace remaining `import.meta.env`, React Router, and browser token assumptions.
20. Add tests and run build/type/lint checks.
21. Remove obsolete Vite/SPAs files after Next parity is confirmed.

## Detailed Task Breakdown

### Foundation Tasks

- Create `src/app/layout.tsx` with global metadata and root HTML/body.
- Create `src/app/globals.css` from current global CSS.
- Create `src/app/page.tsx` root redirect logic.
- Create `src/app/(public)/login/page.tsx`.
- Create `src/app/(protected)/layout.tsx`.
- Create `src/middleware.ts` or equivalent proxy guard if selected.
- Create `src/config/env.ts` with Zod validation.
- Create `src/container/dependency-container.ts`.
- Move brand assets to public.
- Configure Tailwind for `src/app`, `src/modules`, and `src/shared`.

### Shared Presentation Tasks

- Port Button.
- Port Modal.
- Port Table.
- Port Pagination.
- Port Badge.
- Port Card.
- Port Spinner.
- Port Toast host/helpers.
- Port SearchField.
- Port PageHeader.
- Port StatCard.
- Port Breadcrumbs.
- Port CommandPalette.
- Port QuickActions.
- Port MaintenanceBanner.
- Port protected Layout shell.

### Auth Tasks

- Define `ActorContext` and safe actor DTO.
- Define login request/response DTOs.
- Add login server action.
- Add logout server action or route handler.
- Add session refresh strategy.
- Replace local/session storage auth bootstrap.
- Add permission-aware navigation model.
- Add session-expired user feedback.

### Module Tasks

For each active module:

- Define DTOs used by the UI.
- Define query use cases.
- Define mutation use cases.
- Define server action schemas.
- Define route handlers needed for table refresh/search/export.
- Port list/table view.
- Port filters/search controls.
- Port create/edit modal or dialog.
- Port row actions.
- Port loading, empty, error, and success states.
- Port exports/downloads if applicable.
- Add permission checks.
- Add smoke test or focused component/action test.

## Acceptance Criteria

The migration is complete when:

- All active user-facing routes render in Next.js.
- Login, logout, session expiry, and protected redirects work.
- Navigation only shows modules allowed for the current actor.
- Customers, vendors, bookings, payments, expenses, refunds, reports, audit logs, and users preserve current workflows.
- Quick actions open the correct create dialogs.
- Tables preserve loading, empty, error, refresh, and pagination behavior.
- Forms preserve validation, create, edit, success, and failure behavior.
- Report filters and exports work.
- Audit and user routes remain owner/permission protected.
- No active UI imports React Router.
- No active UI depends on `import.meta.env`.
- No active UI requires browser token storage for normal operation.
- Server-only modules do not leak secrets or infrastructure objects to browser bundles.
- Build, typecheck, lint, and relevant tests pass.

## Known Risks

- The booking form is large and should be migrated in a dedicated iteration with regression checks.
- Customer/vendor report exports may depend on browser download code and should move to route handlers carefully.
- Legacy Firebase ticket upload code may introduce missing dependencies and should stay quarantined.
- Current auth mixes cookies and browser bearer storage; the migration must avoid creating two competing sources of truth.
- Role checks in the current UI are simple Owner/Admin checks; target architecture expects permission-based authorization.
- Some old routes and components may be unused but still import browser or router APIs.
- Removing Vite files should happen only after the Next app reaches route parity.

## Verification Plan

Run these checks during migration:

- Next build after foundation work.
- Typecheck after each module port.
- Lint after shared UI and module ports.
- Manual route smoke test for every route in the migration map.
- Auth smoke test for guest, Admin, and Owner.
- Form submission smoke tests for each create/edit modal.
- Money workflow tests for payments, expenses, and refunds.
- Booking workflow tests for create/edit with nested PAX and segments.
- Report export smoke tests.

For documentation-only planning changes, no executable verification is required.
