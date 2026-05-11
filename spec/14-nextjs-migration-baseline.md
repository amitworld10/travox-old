# Next.js Migration Baseline

## Purpose

This file captures the pre-implementation baseline for migrating Travox into the root `src/` Next.js application. It supports Iteration 10 from `tasks.md` and should be updated only when the baseline itself changes or when a later migration phase intentionally replaces one of these surfaces.

## Workspace State

- Root `src/` exists and is currently empty.
- Existing Vite client remains under `client/`.
- Existing Express API remains under `server/`.
- Existing migration execution guide is `spec/13-end-to-end-nextjs-migration.md`.
- Migrated application code must be created under root `src/`.
- Prisma schema and migrations should live under root `prisma/`, matching the end-to-end migration plan.

## Active UI Route Baseline

Current active UI routes come from `client/src/routes/routeConfig.tsx`.

| Current route | Current page | Module gate | Target Next route |
| --- | --- | --- | --- |
| `/customers` | `CustomersPage` | `customers` | `src/app/(protected)/customers/page.tsx` |
| `/reports` | `ReportsCenterPage` | `customers` | `src/app/(protected)/reports/page.tsx` |
| `/reports/:reportId` | `ReportRunnerPage` | `customers` | `src/app/(protected)/reports/[reportId]/page.tsx` |
| `/customers/report` | `CustomerReportPage` | `customers` | `src/app/(protected)/customers/report/page.tsx` |
| `/vendors` | `VendorsPage` | `vendors` | `src/app/(protected)/vendors/page.tsx` |
| `/vendors/report` | `VendorReportPage` | `vendors` | `src/app/(protected)/vendors/report/page.tsx` |
| `/bookings` | `BookingsPage` | `bookings` | `src/app/(protected)/bookings/page.tsx` |
| `/payments` | `PaymentsPage` | `payments` | `src/app/(protected)/payments/page.tsx` |
| `/expenses` | `ExpensesPage` | `expenses` | `src/app/(protected)/expenses/page.tsx` |
| `/refunds` | `RefundsPage` | `refunds` | `src/app/(protected)/refunds/page.tsx` |
| `/logs` | `AuditLogsPage` | `logs` | `src/app/(protected)/logs/page.tsx` |
| `/users` | `UsersPage` | `users` | `src/app/(protected)/users/page.tsx` |

Current default protected route is `/customers`.

## Express API Route Baseline

Current route files live under `server/src/api/routes`.

### Health

- `GET /health`
- `GET /ping`

### Auth

- `POST /auth/google`
- `POST /auth/logout`
- `POST /auth/refresh`

### Accounts

- `GET /accounts`
- `GET /accounts/:id`
- `POST /accounts`
- `PUT /accounts/:id`
- `DELETE /accounts/:id`
- `POST /accounts/:id/archive`

### Audit Logs

- `POST /audit-logs`
- `GET /audit-logs`
- `GET /audit-logs/export`
- `GET /audit-logs/entity/:entity/:entityId`
- `GET /audit-logs/actor/:actorId`
- `GET /audit-logs/date-range`

### Bookings

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

### Customers

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

### Vendors

- `POST /vendors`
- `GET /vendors`
- `GET /vendors/search`
- `GET /vendors/report`
- `GET /vendors/:id`
- `PUT /vendors/:id`
- `GET /vendors/:id/stats`
- `GET /vendors/:id/account`
- `DELETE /vendors/:id`

### Payments, Expenses, and Refunds

- `POST /payments/receivable`
- `POST /payments/expense`
- `POST /payments/inbound-refund`
- `POST /payments/outbound-refund`
- `GET /payments`
- `GET /payments/:id`

### Reports

- `GET /reports/catalog`
- `GET /reports/:reportId`
- Direct report aliases:
  - `GET /reports/sales-by-customer-detail`
  - `GET /reports/customer-balance-detail`
  - `GET /reports/customer-payment-details`
  - `GET /reports/payment-details-by-customer`
  - `GET /reports/customer-ledger`
  - `GET /reports/invoice-credit-note-list-by-date`
  - `GET /reports/invoice-list`
  - `GET /reports/invoices-by-month`
  - `GET /reports/sales-by-product-service-detail`
  - `GET /reports/transaction-list-by-customer`
  - `GET /reports/transaction-list-by-date`
  - `GET /reports/payment-splits-by-customer`
  - `GET /reports/vendor-ledger`
  - `GET /reports/outstanding-payments`
  - `GET /reports/monthly-income-expense`
  - `GET /reports/refund-register`
  - `GET /reports/booking-register`
  - `GET /reports/gst-view`

### Users

- `GET /users`
- `GET /users/me`
- `PUT /users/me`
- `GET /users/:id`
- `PATCH /users/change-role`
- `PATCH /users/:id/activate`
- `PATCH /users/:id/deactivate`

### Files

- `POST /files`
- `GET /files`
- `GET /files/:id`
- `GET /files/:id/download`
- `PUT /files/:id`
- `DELETE /files/:id`

### OCR and Schema

- `POST /scan`
- `GET /scan`
- `GET /schema`

`POST /scan` accepts either `fileId` query usage or multipart upload. Current multer limits uploads to 50 MB and allows JPEG, PNG, GIF, WebP, and PDF.

### Metrics

- `GET /metrics`
- `POST /metrics/reset`

## Environment Baseline

Current client variables:

- `VITE_API_BASE`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_TOKEN_KEY`
- `VITE_USER_KEY`
- `VITE_MAINTENANCE_MODE`
- `VITE_MAINTENANCE_MESSAGE`
- `VITE_MAINTENANCE_DETAILS`

Current server variables:

- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `JWT_ISSUER`
- `ACCESS_TOKEN_LIFETIME`
- `REFRESH_TOKEN_LIFETIME`
- `COOKIE_DOMAIN`
- `COOKIE_SAME_SITE`
- `MONGODB_URI`
- `MONGODB_HOST`
- `MONGODB_PORT`
- `MONGODB_DATABASE`
- `MONGODB_USER`
- `MONGODB_PASSWORD`
- `MONGODB_AUTH_SOURCE`
- `MONGODB_POOL_SIZE`
- `MONGODB_MIN_POOL_SIZE`
- `REDIS_URL`
- `OAUTH_CLIENT_ID`
- `OAUTH_ALLOWED_DOMAINS`
- `FILE_STORAGE_PROVIDER`
- `FILE_STORAGE_ALLOW_LOCAL_FALLBACK`
- `LOCAL_FILE_STORAGE_PATH`
- `GDRIVE_CLIENT_ID`
- `GDRIVE_CLIENT_SECRET`
- `GDRIVE_REFRESH_TOKEN`
- `SHARED_FOLDER_ID`
- `GEMINI_API_KEY`
- `LOG_LEVEL`
- `GOOGLE_APPLICATION_CREDENTIALS`

Target Next.js variables are defined in `spec/13-end-to-end-nextjs-migration.md`. During migration, browser-safe values must move to `NEXT_PUBLIC_*`; database URLs, JWT keys/secrets, refresh secrets, Redis URLs, Google Drive secrets, and Gemini keys must remain server-only.

## Manual Smoke Baseline

Before retiring Vite or Express, these workflows must be manually smoke-tested or covered by automated tests:

- Login through Google and logout.
- Refresh session after access token expiry.
- Customer create, search, edit, delete, import, stats, bookings, and report entry.
- Vendor create, search, edit, delete, stats, account lookup, and report entry.
- Account create, edit, delete, archive, and account lookup from money workflows.
- Booking create, edit, list, search/filter, confirm, cancel, complete, status update, and delete.
- Receivable payment creation with overpayment prevention.
- Expense creation with destination account/vendor resolution.
- Inbound refund creation against previous expense.
- Outbound refund creation against previous receivable and linked booking updates.
- Report catalog, report runner, customer report, vendor report, and export/download behavior.
- File upload, list, detail, download, edit, and delete.
- OCR scan by upload, scan by file ID, health, schema, configured-provider success, and missing-provider error.
- Audit log list, filters, entity/actor/date views, and CSV export.
- User list, current user profile update, role change, activate, and deactivate.
- Metrics read and reset for owner-only access.

## Data Migration Decision

The migration plan still needs a product decision:

- If production Mongo data must be migrated, Iteration 20 must include export, transformation, legacy ID mapping, embedded booking split, and reconciliation checks.
- If the Next/Supabase deployment can start fresh, Iteration 20 can keep migration scripts as optional tooling and focus cutover on route/API parity.

Until this is decided, the implementation should preserve a migration-capable schema and avoid assumptions that only fresh data exists.
