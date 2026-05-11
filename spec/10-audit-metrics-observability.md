# Audit, Metrics, and Observability Functional Spec

## Purpose

Audit and observability features let owners understand who changed what, when it happened, and whether system caching is behaving correctly. Audit logs support accountability for mutating operations. Metrics support operational diagnosis.

## Audit Scope

Audit logs should capture mutating operations:

- Create.
- Update.
- Delete.
- Status changes where represented separately.
- Login/logout if explicitly recorded.

Read-only viewing should not create audit logs by default.

Failed operations should not be recorded as successful mutations.

## Audit Data

Each audit entry should include:

- Timestamp.
- Action.
- Entity type.
- Entity ID.
- Actor ID.
- Actor display name when resolvable.
- Before data for updates/deletes when available.
- After data for creates/updates when available.
- IP address.
- User agent.
- Workspace/org context.

Diff behavior:

- Create: before is empty/null, after contains created data.
- Update: before and after both exist when before-state was captured.
- Delete: before contains deleted data, after is empty/null.
- If a diff cannot be parsed, show raw data safely rather than crashing the UI.

## Audit Logs Screen

This is an owner-only screen.

Top controls:

- Page title: "Audit Logs".
- Description: explains that it tracks mutating operations and access history.
- Refresh button: reloads the current page of logs.
- Export CSV button: downloads audit logs in CSV format.

Summary cards:

- Visible Logs: number of logs currently displayed.
- Total Logs: total matching/available logs.
- Actors In Page: number of distinct resolved actors on the current page.

Pagination:

- Shown when logs exist and loading is complete.
- Supports 5, 10, 20, 50, and 100 rows per page.
- Changing page or page size reloads logs.

Loading state:

- Shows centered spinner with "Loading audit logs...".

Empty state:

- Shows an audit-log empty state when no logs exist.

## Audit Table

Columns:

- Timestamp: formatted date/time with calendar icon.
- Action: colored action badge.
- Entity: uppercase entity name plus entity ID when known.
- Actor: resolved actor display name.
- Actions: Details button.

Action badge behavior:

- Create should read as a positive/success action.
- Update/status changes should read as neutral or warning depending on visual system.
- Delete should read as destructive.
- Unknown actions should remain legible with a default badge.

Details button:

- Opens a modal for the selected log.
- Passes resolved user map so actor names can be shown.

## Audit Detail Modal

The modal should show:

- Actor name and ID.
- Timestamp.
- Entity and entity ID.
- Action.
- IP address and user agent.
- Before snapshot.
- After snapshot.
- Difference sections when available.

Functional expectations:

- JSON should be formatted for scanning.
- Long values should wrap or scroll without breaking layout.
- Missing before/after values should display as "None" or equivalent.
- Closing modal returns to the same audit table page.

## Export CSV

Behavior:

- Export should include enough columns for offline review: timestamp, actor, action, entity, entity ID, IP, user agent, and diff data or diff summary.
- Export should not require the user to manually page through all records if the backend supports all-record export.
- If export fails, show an error or log failure clearly.

## Metrics Functionality

Metrics are owner-only operational diagnostics for cache behavior.

Metrics should include:

- Cache hits.
- Cache misses.
- Cache sets.
- Cache deletes.
- Cache errors.
- Hit rate.
- Total cache operations.

Actions:

- View current metrics.
- Reset metrics counters.

Expected behavior:

- Reset should require owner access.
- Reset should clear counters but not delete business data.
- Metrics failures should not affect normal business workflows.

## Health and Runtime Observability

Health behavior:

- Health endpoint should return service status, timestamp, service name, and version.
- Ping endpoint should return a minimal successful response.

Logging behavior:

- Requests should be logged with method, route, status, and latency where possible.
- Errors should be logged with enough detail to diagnose without exposing secrets.
- Auth tokens, refresh tokens, uploaded file contents, private keys, and OAuth credentials must never be logged.

## Functional Acceptance Criteria

- Owner can open audit logs and see recent mutations.
- Owner can page through audit logs.
- Owner can open a detail modal and inspect before/after data.
- Owner can export audit logs to CSV.
- Non-owner users cannot access audit logs or metrics.
- Cache metrics show hits, misses, sets, deletes, errors, hit rate, and total operations.
- Resetting metrics does not affect customers, bookings, payments, reports, or files.

