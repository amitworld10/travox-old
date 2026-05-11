# Repository Map

## Purpose

This spec describes the repository organization and how the major pieces fit together. Use it as the first document when reconstructing Travox or onboarding an agent.

## Root

- `client/`: React single-page application.
- `server/`: Express API and business logic.
- `docs/revamp/`: historical revamp notes, migration notes, parity matrix, smoke checklist, and architecture notes.
- `scripts/smoke/revamp-smoke.sh`: shell smoke checks for the revamp work.
- `compose.yml`: Redis, server, and client service definition.
- `build.yml`, `deploy.yml`: deployment/pipeline assets.
- `deep-analysis.md`, `features.md`, `reporting-features.md`, `ux-revamp-plan.md`: existing planning and analysis documents.
- `README.md`: top-level human guide.
- `AGENTS.md`: coding-agent guide.
- `PLANS.md`, `tasks.md`: documentation execution plan and task tracker.
- `spec/`: module reconstruction specs.

## Client Source Map

- `client/src/App.tsx`: top-level router, public/protected guards, role access guard, session-expired modal, mobile unsupported-device gate.
- `client/src/main.tsx`: React DOM entrypoint.
- `client/src/index.css`: Tailwind and global styles.
- `client/src/routes/routeConfig.tsx`: active lazy-loaded product routes.
- `client/src/components/auth`: Google auth UI.
- `client/src/components/customers`: customer management table, forms, bookings modal, search hook.
- `client/src/components/vendors`: vendor management table/forms.
- `client/src/components/bookings`: booking management, filters, customer search, V2 booking form, V2 form hook/types.
- `client/src/components/payments`: payment list/forms and payment mode helpers.
- `client/src/components/expenses`: expense list/forms and shared payment mode helpers.
- `client/src/components/refunds`: refund management and creation dialog.
- `client/src/components/reports`: reporting center, report runner, customer/vendor report pages, export helpers, UI registry.
- `client/src/components/auditLogs`: audit log list, detail modal, empty state, utilities.
- `client/src/components/users`: owner-only user access management.
- `client/src/components/ui`: reusable buttons, badges, cards, table, modal, pagination, loader/spinner, toast, layout, maintenance banner.
- `client/src/design-system`: newer tokens, primitives, shell, and page patterns.
- `client/src/services`: typed service wrappers for users and audit logs.
- `client/src/utils`: axios connector, role access, date/time helpers, misc formatting, toasts.
- `client/src/types`: frontend DTOs and legacy-compatible types.

## Server Source Map

- `server/src/index.ts`: loads env, validates required env vars, initializes DI, connects MongoDB, starts server, handles shutdown.
- `server/src/server.ts`: creates Express app, installs CORS/body/date/cookie/logger middleware, health routes, Swagger, API routes, error handler.
- `server/src/api/routes.ts`: registers all route modules.
- `server/src/api/routes/*`: Express endpoint definitions.
- `server/src/api/controllers/*`: HTTP adapters that resolve use cases, read `req.user`, call business logic, and shape responses.
- `server/src/application/useCases/*`: business workflows grouped by module.
- `server/src/application/repositories/*`: repository contracts.
- `server/src/application/services/*`: service contracts.
- `server/src/domain/*`: entity classes and invariants.
- `server/src/infrastructure/repositories/mongodb/*`: Mongo/Mongoose repository implementations and cached wrappers.
- `server/src/infrastructure/services/*`: Redis, JWT, Google OIDC, Google Drive/local file storage.
- `server/src/models/mongoose/*`: Mongoose schemas.
- `server/src/models/FirestoreTypes.ts`: canonical enums and interface-style document contracts. The name is legacy.
- `server/src/middleware/*`: auth, refresh-token guard, audit, date parser/serializer, logger, error handler.
- `server/src/config/*`: MongoDB, Redis, logger, Swagger, dependency container.
- `server/src/services/*`: Gemini OCR and schema reflection.
- `server/src/utils/*`: masking, timezone, CSV parsing, file transform, cache rehydration, errors.

## Dependency Flow

Frontend:

```text
Pages -> Feature Components -> apiConnector/services -> Backend API
       -> UI primitives/design-system
       -> roleAccess/AppContext for auth state
```

Backend:

```text
Routes -> Controllers -> Use Cases -> Domain Entities
                               -> Repository Interfaces -> Cached Mongo Repos -> Mongo Repos -> Mongoose Models
                               -> Service Interfaces -> Infrastructure Services
```

## Rebuild Order

1. Create backend domain model and enums.
2. Create Mongoose schemas and repository mappings.
3. Create repository interfaces and use cases.
4. Wire DI container.
5. Add middleware, controllers, routes, Swagger.
6. Build frontend API connector, auth page, route guards, layout, UI primitives.
7. Build feature modules in this order: accounts, customers, vendors, bookings, payments/refunds/expenses, reports, files/OCR, audit logs, users.
8. Add Docker/Compose and operational docs.

