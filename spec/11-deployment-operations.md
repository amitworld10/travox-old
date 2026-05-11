# Deployment and Operations Spec

## Purpose

This spec describes how Travox is built, configured, deployed, and operated.

## Local Runtime

Services required:

- MongoDB
- Redis
- server API on port 3000
- Vite client on port 5173

## Docker Compose

`compose.yml` defines:

- `redis`: `redis:alpine`, port 6379, persistent volume.
- `server`: built from `server/Dockerfile`, port 3000, env file `server/.env`, `REDIS_URL=redis://redis:6379`, depends on Redis.
- `client`: built from `client/Dockerfile`, serves via Nginx on port 80, depends on server.

## Client Dockerfile

Build stage:

- Node 20 Alpine
- `npm install`
- accepts build args for Vite env variables
- `npm run build`

Runtime stage:

- Nginx Alpine
- copies `nginx.conf`
- serves `dist`
- health checks `index.html`

## Server Dockerfile

Uses Bun 1.3 Alpine:

- installs dependencies with `bun install`
- copies source
- sets `GOOGLE_APPLICATION_CREDENTIALS=/app/firestore-creds.json`
- runs `bun run deploy-indexes`
- runs `bun run build`
- installs production dependencies
- creates non-root `tmsuser`
- health checks `/health`
- starts with `bun run start`

Important: the Firestore index deployment step is legacy and may fail or be unnecessary in Mongo-only environments.

## Environment Checklist

Server required:

- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `MONGODB_URI`
- `OAUTH_CLIENT_ID`

Server recommended:

- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`
- `REDIS_URL`
- `JWT_ISSUER`
- `ACCESS_TOKEN_LIFETIME`
- `REFRESH_TOKEN_LIFETIME`
- `COOKIE_DOMAIN`
- `COOKIE_SAME_SITE`
- `OAUTH_ALLOWED_DOMAINS`
- `GEMINI_API_KEY`
- `FILE_STORAGE_PROVIDER`
- `LOCAL_FILE_STORAGE_PATH`
- `GDRIVE_CLIENT_ID`
- `GDRIVE_CLIENT_SECRET`
- `GDRIVE_REFRESH_TOKEN`
- `SHARED_FOLDER_ID`
- `LOG_LEVEL`

Client required:

- `VITE_API_BASE`
- `VITE_GOOGLE_CLIENT_ID`

Client optional:

- `VITE_TOKEN_KEY`
- `VITE_USER_KEY`
- `VITE_MAINTENANCE_MODE`
- `VITE_MAINTENANCE_MESSAGE`
- `VITE_MAINTENANCE_DETAILS`

## Operational Commands

Client:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run start`

Server:

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run test`
- `npm run flush-redis`

## Smoke Checks

Minimum checks:

1. `GET /health` returns OK.
2. Swagger opens at `/docs`.
3. Google login returns user and tokens.
4. Protected route rejects missing token.
5. Customer create/list/update/delete works.
6. Booking create/search/filter works.
7. Receivable payment updates booking due amount.
8. Reports catalog and one report endpoint work.
9. Redis metrics endpoint works for owner.

## Rebuild Notes

- Align Docker build commands with the package manager used in production.
- Remove or isolate legacy Firestore index deployment in Mongo-only deployments.
- Use HTTPS in production when SameSite=None cookies are enabled.
- Set explicit `CORS_ORIGIN` values; avoid wildcard origins with credentials.

