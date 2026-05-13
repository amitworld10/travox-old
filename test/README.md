# Travox Automation Tests

The E2E suite in `test/e2e/travox-workflows.test.mjs` runs against a live Next.js server and uses the migrated App Router API routes.

## Run

Start the app separately, then run:

```bash
npm run test:e2e
```

By default the tests skip unless a base URL and an auth method are provided.

## Environment

Required:

- `TRAVOX_E2E_BASE_URL`: local or preview server URL, for example `http://localhost:3000`.

Provide one auth method:

- `TRAVOX_E2E_GOOGLE_ID_TOKEN`: real Google test ID token for `/api/auth/google`.
- `TRAVOX_E2E_COOKIE`: pre-authenticated cookie header, for example `travox-at=...; refreshToken=...`.
- `TRAVOX_E2E_ACCESS_TOKEN`: bearer access token.

Optional:

- `TRAVOX_E2E_EXPECT_OWNER=1`: require metrics reset to succeed instead of allowing permission denial.
- `TRAVOX_E2E_EXPECT_USERS_IMPLEMENTED=1`: require user-management endpoints to be implemented instead of accepting current migration placeholders.
- `TRAVOX_E2E_TARGET_USER_ID`: user ID to use for role/status-management checks when user endpoints are implemented.
- `TRAVOX_E2E_SKIP_DESTRUCTIVE=1`: keep created test data instead of deleting created records.

The suite creates uniquely named customers, vendors, accounts, bookings, payments, files, and OCR jobs. Use an isolated test database or disposable organization.
