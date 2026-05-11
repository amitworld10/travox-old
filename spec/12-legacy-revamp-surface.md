# Legacy and Revamp Surface Spec

## Purpose

Travox contains active routed modules and a set of older or revamp-era modules that remain in the tree. This spec explains how to treat them.

## Existing Documentation

- `deep-analysis.md`: prior full-codebase analysis and risk list.
- `features.md`: feature catalog.
- `reporting-features.md`: reporting feature notes.
- `ux-revamp-plan.md`: UX revamp strategy.
- `docs/revamp/architecture-note.md`
- `docs/revamp/migration-log.md`
- `docs/revamp/parity-matrix.md`
- `docs/revamp/smoke-checklist.md`
- `docs/revamp/test-suite-report.md`

## Active Surface

Active route config includes:

- customers
- vendors
- bookings
- payments
- expenses
- refunds
- reports
- audit logs
- users
- legacy route wrapper

## Legacy or Non-Routed Surface

Components that are in the tree but not active route targets:

- `client/src/components/dashboard/*`
- `client/src/components/ledgers/*`
- `client/src/components/calendar/*`
- `client/src/components/settings/*`
- `client/src/components/tickets/*`
- `client/src/firebaseconfig.ts`

These may represent prior UI work, experiments, or future migration targets. Do not remove or refactor them unless specifically requested.

## Legacy Naming

`server/src/models/FirestoreTypes.ts` contains canonical enums and document interfaces but carries a Firestore name from earlier architecture. The active repository layer is Mongo/Mongoose.

Some comments in Redis and Docker files still refer to Firestore. Treat these as drift unless code proves Firestore is active for the requested task.

## Rebuild Strategy

For a similar product, rebuild the active surface first:

1. Auth/users/RBAC.
2. Accounts.
3. Customers/vendors.
4. Bookings.
5. Payments/expenses/refunds.
6. Reports.
7. Files/OCR.
8. Audit/metrics.

Then decide whether to reintroduce legacy surfaces:

- dashboard analytics
- ledger pages
- reminder calendar
- settings and Firebase setup
- ticket upload manager

## Agent Guidance

- Prefer active route config over file existence when determining product behavior.
- If a legacy component conflicts with active backend contracts, document the conflict before editing.
- Do not assume Firebase is required for active workflows.
- Do not delete legacy docs; consolidate or reference them.

