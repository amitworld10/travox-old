# Travox

Travox is a full-stack travel management system for travel agencies. It manages customers, vendors, bookings, receivables, expenses, refunds, accounts, reports, uploaded travel documents, OCR-assisted booking extraction, audit logs, and role-based user access.

The repository is split into a React/Vite client and an Express/TypeScript API. The backend uses MongoDB through Mongoose, Redis for repository/report caching, JWT plus Google Sign-In for authentication, and Google Drive or local storage for file persistence.

## Repository Layout

```text
.
├── client/                 React 18, Vite, Tailwind frontend
├── server/                 Express 5, TypeScript backend
├── docs/revamp/            Historical revamp documentation
├── scripts/smoke/          Smoke-check scripts
├── spec/                   Reconstruction-grade module specs
├── compose.yml             Local/container orchestration
├── build.yml, deploy.yml   Deployment pipeline assets
├── PLANS.md                Documentation work plan
└── tasks.md                Documentation task checklist
```

## Product Modules

- Authentication: Google ID token login, JWT access/refresh tokens, httpOnly cookies, refresh rotation, logout.
- User access: Owner/Admin roles, route guards, owner-only audit/user/metrics surfaces.
- Customers: customer records, sensitive ID masking, accounts, booking counters, total spend, CSV import, booking reports.
- Vendors: vendor records, service types, GSTIN masking, accounts, total expense, booking reports.
- Bookings: passenger lists, itineraries, mode-specific segments, booking status lifecycle, payment totals, search/filter/stats.
- Payments: receivables, expenses, inbound refunds, outbound refunds, payment modes, account references, side-effect updates.
- Accounts: bank/UPI account records used by customers, vendors, and payment flows.
- Reports: report catalog and dynamic report runner for customer, vendor, transaction, refund, booking, GST, and income/expense views.
- Files and OCR: file upload/download/delete plus Gemini-based document extraction for booking prefill.
- Audit logs: write-operation capture for create/update/delete/status changes.
- Metrics: Redis cache metrics and reset endpoint for owners.
- Legacy surfaces: dashboard, ledgers, calendar, settings, and ticket upload components remain in the tree but are not part of the active route config.

## Architecture

### Backend

The server follows a layered structure:

```text
server/src
├── index.ts                         env validation, Mongo connection, server start
├── server.ts                        Express app setup, middleware, Swagger, routes
├── api/routes                       endpoint registration
├── api/controllers                  HTTP request/response orchestration
├── application/useCases             business workflows
├── application/repositories         repository interfaces
├── application/services             service interfaces
├── domain                           domain entities and business methods
├── infrastructure/repositories      Mongo and cached repository implementations
├── infrastructure/services          JWT, Google OIDC, Google Drive, Redis
├── middleware                       auth, audit, dates, errors, logging
├── models/mongoose                  MongoDB schemas
├── services                         OCR and schema reflection
└── utils                            parsing, masking, timezone, cache rehydration
```

The backend uses `tsyringe` dependency injection. `server/src/config/container.ts` binds repository interfaces to cached Mongo implementations where possible, and binds services such as `IJwtService`, `IGoogleOidcService`, `IGoogleDriveService`, and `RedisService`.

### Frontend

The client is a React single-page app:

```text
client/src
├── App.tsx                          router, auth guard, role guard, mobile guard
├── routes/routeConfig.tsx           active module route list
├── components                       feature components and UI primitives
├── pages                            route-level wrappers
├── design-system                    tokens, primitives, page patterns, shell helpers
├── contexts/AppContext.tsx          stored user/auth context shim
├── services                         user and audit log services
├── utils/apiConnector.ts            axios client, refresh handling, errors
├── utils/roleAccess.ts              Owner/Admin module access
└── types/index.ts                   frontend DTOs and legacy types
```

Active routes are `/customers`, `/reports`, `/reports/:reportId`, `/customers/report`, `/vendors`, `/vendors/report`, `/bookings`, `/payments`, `/expenses`, `/refunds`, `/logs`, and `/users`.

## Backend API Surface

All business routes are protected with `requireAuth()` unless noted. Owner-only routes use `requireAuth([UserRole.OWNER])`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health`, `GET /ping` |
| Auth | `POST /auth/google`, `POST /auth/logout`, `POST /auth/refresh` |
| Customers | `POST /customers`, `POST /customers/import`, `GET /customers`, `GET /customers/search`, `GET /customers/report`, `GET /customers/:id`, `PUT /customers/:id`, `GET /customers/:id/stats`, `GET /customers/:id/bookings`, `GET /customers/:id/account`, `DELETE /customers/:id` |
| Vendors | `POST /vendors`, `GET /vendors`, `GET /vendors/search`, `GET /vendors/report`, `GET /vendors/:id`, `PUT /vendors/:id`, `GET /vendors/:id/stats`, `GET /vendors/:id/account`, `DELETE /vendors/:id` |
| Bookings | `POST /bookings`, `GET /bookings`, `GET /bookings/search`, `GET /bookings/filter`, `GET /bookings/upcoming`, `GET /bookings/overdue`, `GET /bookings/revenue-stats`, `GET /bookings/stats`, `GET /bookings/travel-dates`, `GET /bookings/:id`, `PUT /bookings/:id`, `PATCH /bookings/:id/status`, `PATCH /bookings/:id/cancel`, `PATCH /bookings/:id/confirm`, `PATCH /bookings/:id/complete`, `DELETE /bookings/:id` |
| Payments | `POST /payments/receivable`, `POST /payments/expense`, `POST /payments/inbound-refund`, `POST /payments/outbound-refund`, `GET /payments`, `GET /payments/:id` |
| Accounts | `GET /accounts`, `GET /accounts/:id`, `POST /accounts`, `PUT /accounts/:id`, `DELETE /accounts/:id`, `POST /accounts/:id/archive` |
| Audit Logs | `POST /audit-logs`, `GET /audit-logs`, `GET /audit-logs/export`, `GET /audit-logs/entity/:entity/:entityId`, `GET /audit-logs/actor/:actorId`, `GET /audit-logs/date-range` |
| Users | `GET /users`, `GET /users/me`, `PUT /users/me`, `GET /users/:id`, `PATCH /users/change-role`, `PATCH /users/:id/activate`, `PATCH /users/:id/deactivate` |
| Files | `POST /files`, `GET /files`, `GET /files/:id`, `GET /files/:id/download`, `PUT /files/:id`, `DELETE /files/:id` |
| OCR | `POST /scan`, `GET /scan`, `GET /schema` |
| Metrics | `GET /metrics`, `POST /metrics/reset` |
| Reports | `GET /reports/catalog`, `GET /reports/:reportId`, plus compatibility routes for each supported report ID |

Swagger is served at `/docs`.

## Data Model Summary

Core enums live in `server/src/models/FirestoreTypes.ts` even though persistence is MongoDB:

- `UserRole`: `Owner`, `Admin`
- `ServiceType`: `Airline`, `Hotel`, `Rail`, `Bus`, `Cab`, `DMC`, `Visa`, `Insurance`, `Other`
- `BookingStatus`: `Draft`, `Confirmed`, `Ticketed`, `In Progress`, `Completed`, `Cancelled`, `Refunded`
- `ModeOfJourney`: `FLIGHT`, `TRAIN`, `BUS`, `HOTEL`, `CAB`, `OTHER`
- `PaymentType`: `RECEIVABLE`, `EXPENSE`, `REFUND_INBOUND`, `REFUND_OUTBOUND`
- `PaymentMode`: `CASH`, `CARD`, `UPI`, `NETBANKING`, `BANK_TRANSFER`, `CHEQUE`, `WALLET`, `OTHER`
- `FileKind`: `TICKET`, `INVOICE`, `VOUCHER`, `PASSPORT`, `VISA`, `OTHER`

Domain entities are `Customer`, `Vendor`, `Booking`, `BookingPax`, `BookingItinerary`, `BookingSegment`, `Payment`, `Account`, `User`, `Organization`, and `AuditLog`.

## Setup

### Prerequisites

- Node.js 20 or newer for the client.
- Node.js/Bun-compatible environment for the server. The Dockerfile uses Bun, while local scripts use npm/ts-node.
- MongoDB.
- Redis.
- Google OAuth client ID for sign-in.
- RSA private/public key pair for JWT signing.
- Optional Google Drive OAuth credentials for cloud file storage.
- Optional Gemini API key for OCR.

### Server Environment

Required:

```env
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
MONGODB_URI="mongodb://localhost:27017/travox"
OAUTH_CLIENT_ID="google-client-id.apps.googleusercontent.com"
```

Common optional values:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379
JWT_ISSUER=https://auth.example.com
ACCESS_TOKEN_LIFETIME=15m
REFRESH_TOKEN_LIFETIME=30d
COOKIE_DOMAIN=
COOKIE_SAME_SITE=lax
OAUTH_ALLOWED_DOMAINS=
GEMINI_API_KEY=
FILE_STORAGE_PROVIDER=local
FILE_STORAGE_ALLOW_LOCAL_FALLBACK=true
LOCAL_FILE_STORAGE_PATH=tmp/file-storage
GDRIVE_CLIENT_ID=
GDRIVE_CLIENT_SECRET=
GDRIVE_REFRESH_TOKEN=
SHARED_FOLDER_ID=
LOG_LEVEL=info
```

The server can also build a Mongo URI from `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DATABASE`, `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_AUTH_SOURCE`, `MONGODB_POOL_SIZE`, and `MONGODB_MIN_POOL_SIZE`.

### Client Environment

```env
VITE_API_BASE=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=google-client-id.apps.googleusercontent.com
VITE_TOKEN_KEY=travox-at
VITE_USER_KEY=travox-ua
VITE_MAINTENANCE_MODE=false
VITE_MAINTENANCE_MESSAGE=
VITE_MAINTENANCE_DETAILS=
```

### Local Development

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Start infrastructure manually or with Compose:

```bash
docker compose -f compose.yml up redis
```

Run the API:

```bash
cd server
npm run dev
```

Run the client:

```bash
cd client
npm run dev
```

Expected local URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Health: `http://localhost:3000/health`

## Scripts

Client:

- `npm run dev`: start Vite.
- `npm run build`: build production bundle.
- `npm run lint`: run ESLint.
- `npm run typecheck`: run TypeScript without emitting.
- `npm run test`: lint plus typecheck.
- `npm run start`: preview build on port 5173.

Server:

- `npm run dev`: run `src/index.ts` with nodemon and ts-node.
- `npm run build`: compile TypeScript to `dist`.
- `npm run typecheck`: run TypeScript without emitting.
- `npm run start`: run `dist/index.js`.
- `npm run test`: run Jest, passing with no tests.
- `npm run flush-redis`: clear Redis cache through `src/scripts/flushRedisCache.ts`.

## Deployment

`compose.yml` defines Redis, server, and client services. The client image builds static assets and serves them with Nginx. The server image builds with Bun, validates/deploys Firestore indexes through a legacy script target, compiles TypeScript, and runs the API.

Important deployment notes:

- `compose.yml` binds `server/firestore-creds.json`, but current persistence is MongoDB. This is a legacy/deployment artifact.
- The server Dockerfile runs `bun run deploy-indexes`; this depends on Firebase credentials and may be inappropriate for a Mongo-only deployment.
- Production cookies default to `secure: true` and `sameSite: none`, which requires HTTPS.

## Documentation Map

Detailed reconstruction docs are in `spec/`:

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

## Known Risks and Follow-Ups

- Some comments and names still reference Firestore even though the active backend uses MongoDB.
- The client contains legacy modules that are not part of active routing and may carry type or dependency debt.
- The server has strong business workflows but limited automated test coverage.
- Payment and refund flows mutate multiple aggregates; regression tests should cover booking due amounts, customer totals, vendor totals, account references, and report totals.
- Date middleware applies a global IST conversion strategy. Treat timezone changes carefully.

