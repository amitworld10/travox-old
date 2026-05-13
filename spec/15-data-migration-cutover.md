# Data Migration and Cutover Runbook

## Purpose

This runbook covers Iteration 20 for moving legacy Mongo data into the root Next.js Prisma/Postgres model and gating Express/Vite retirement. It does not delete legacy code. Retirement remains blocked until a product data-migration decision, live migration rehearsal, and route/UI parity smoke pass are complete.

## Migration Flow

1. Export legacy Mongo collections to JSONL:

```bash
npm run migration:export:mongo -- --out-dir tmp/migration/mongo-export
```

2. Transform exported JSONL into Prisma-compatible batches:

```bash
npm run migration:transform -- --in-dir tmp/migration/mongo-export --out-dir tmp/migration/prisma-batches
```

3. Inspect `tmp/migration/prisma-batches/manifest.json`.

4. Dry-run the batch loader:

```bash
npm run migration:load:prisma -- --in-dir tmp/migration/prisma-batches --dry-run
```

5. Load into the configured Prisma/Postgres database:

```bash
npm run migration:load:prisma -- --in-dir tmp/migration/prisma-batches
```

6. Run reconciliation:

```bash
npm run migration:reconcile
```

If npm strips dashed flags in the local shell, pass positional paths instead:

```bash
npm run migration:transform -- tmp/migration/mongo-export tmp/migration/prisma-batches
npm run migration:load:prisma -- tmp/migration/prisma-batches dry-run
```

For a single organization, add `-- --org-id=<orgId>` to the reconciliation command.

## Data Mapping Notes

- Legacy Mongo ObjectId strings are preserved as target string IDs because the Prisma schema uses `String` IDs without `@db.Uuid`.
- Every migrated record also writes a `legacy_id_maps` row with `entity`, `legacyId`, and `newId`.
- Embedded booking `pax[]`, `itineraries[]`, and `itineraries[].segments[]` split into `booking_pax`, `booking_itineraries`, and `booking_segments`.
- Legacy `Booking.ticketId` maps to `Booking.ticketFileId`.
- Legacy file `gdriveId` maps to `FileAsset.storageKey` with a `legacy:` prefix and `provider = "google-drive"`.
- User `googleId` creates a `GOOGLE` `AuthIdentity`.
- User role rows resolve against seeded `Role.code` values during load. Run the app's auth seed path or otherwise seed system roles before loading user roles.

## Reconciliation Gates

The reconciliation script verifies:

- Booking `paxCount` equals imported PAX rows.
- Booking `paidAmount`, `refundedAmount`, and `dueAmount` match linked receivable and outbound-refund payments.
- Customer `totalBookings` and `totalSpent` match linked bookings and payments.
- Vendor `totalBookings` and `totalExpense` match linked bookings, expenses, and inbound refunds.
- Entity counts are reported for organizations, users, accounts, customers, vendors, bookings, payments, files, audit logs, and legacy ID maps.

## Cutover Gates

Express API retirement remains blocked until:

- Every active Express endpoint in `spec/14-nextjs-migration-baseline.md` has a migrated Next route handler or documented replacement.
- `npm run migration:reconcile` passes on a migrated production-sized snapshot.
- Critical workflow smoke passes for auth, customers, vendors, accounts, bookings, payments, expenses, refunds, reports, files/OCR, audit logs, users, and metrics.

Vite client retirement remains blocked until:

- Every active Vite route in `spec/14-nextjs-migration-baseline.md` has an active Next UI replacement.
- Browser storage token compatibility is no longer required for normal auth.
- Desktop and mobile smoke passes for all migrated protected routes.

## Verification Commands

```bash
npm run typecheck
npm run lint
npm run prisma:validate
npm run build
npm run migration:transform -- --in-dir tmp/migration/empty-mongo-export --out-dir tmp/migration/prisma-batches
npm run migration:load:prisma -- --in-dir tmp/migration/prisma-batches --dry-run
```
