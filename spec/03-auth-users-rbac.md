# Auth, Users, and RBAC Functional Spec

## Purpose

Authentication gives Travox a single secure entry point. Users sign in with Google, receive a workspace session, and see only the modules allowed by their role. The user administration surface lets owners control who can operate the workspace and whether each member is active.

## Personas

- Owner: controls users, audit logs, metrics, and every operational module.
- Admin: operates day-to-day travel workflows such as customers, vendors, bookings, payments, expenses, and refunds.
- Deactivated user: cannot access the application even with an old token.
- New Google user: can sign in only if the backend accepts their Google identity and domain policy.

## Login Screen

The first screen is a branded Travox sign-in experience.

UI elements:

- Travox badge: identifies the product and confirms the user is on the correct screen.
- Headline and support copy: positions the app as travel operations software.
- Security cards: communicate role-based access and automatic session refresh.
- Google Sign-In button: rendered by Google Identity Services. It is the only login action.
- Loading spinner over the Google button: shown after Google returns a credential and Travox is validating it.
- "Preparing secure Google sign-in..." helper: shown while the Google script or button is not ready.
- Inline error panel: shown when Google script load fails, Google returns no credential, domain validation fails, or Travox login fails.
- Terms/privacy line: passive legal copy; it does not block login.

Functional behavior:

1. The app loads the Google Identity script.
2. If Google Identity is unavailable, show an inline error.
3. Render a pill-shaped Google button when ready.
4. On credential callback, disable visible login affordance with a loading state.
5. Send the Google credential to Travox.
6. On success, persist the access token and user profile for the browser session.
7. Redirect the user to the default operational module, currently customers.
8. On failure, keep the user on the login screen and show the error.

## Session Behavior

Travox uses two layers of session continuity:

- Access token: used for API requests and route guards.
- Refresh token/cookie: used to recover from expired access tokens without forcing a new Google login.

Expected behavior:

- Protected pages require an access token.
- A missing token redirects to the login screen.
- A 401 from the API triggers one refresh attempt.
- If refresh succeeds, the original request is retried.
- If refresh fails, stored auth is cleared and a session-expired modal appears.
- The session-expired modal offers a return-to-login action.
- Logout clears browser-stored auth and relies on the server to clear httpOnly cookies.

## Role Model

Roles:

- Owner: full access.
- Admin: operational access only.

Module access:

- Customers: Owner, Admin
- Vendors: Owner, Admin
- Bookings: Owner, Admin
- Payments: Owner, Admin
- Expenses: Owner, Admin
- Refunds: Owner, Admin
- Reports: Owner, Admin through customer/reporting access
- Audit Logs: Owner
- User Access: Owner
- Metrics: Owner

If a user attempts to navigate to a module they cannot access, redirect them to the first module their role can access.

## User Management Screen

This is an owner-only administrative screen.

Top controls:

- Page title: "User Management".
- Description: explains role and activation management.
- Refresh button: reloads members and resets pending row state.

Summary area:

- Signed in as card: shows current user's display name and role.
- Total Members card: count of users visible on the current loaded page.
- Active Users card: count of active users in the current loaded set.
- Inactive Users card: count of inactive users in the current loaded set.

Pagination:

- Page selector controls server-backed pagination.
- Items-per-page options are 5, 10, 20, 50, and 100.
- Pagination is hidden when no users are loaded or while loading.

Table columns:

- Member: user name and email.
- Role: role dropdown.
- Created At: account creation timestamp or "Never" if unavailable.
- Updated At: last update timestamp or "Never" if unavailable.
- Status: activation toggle and active/inactive label.

Role dropdown behavior:

- Shows all supported roles.
- Changing a role updates the user immediately.
- The current signed-in user cannot change their own role from this table.
- While role update is pending, the dropdown is disabled.
- On success, update the row in place and show a success toast.
- On failure, keep the old value and show an error toast.

Status toggle behavior:

- Active users show a green enabled switch.
- Inactive users show a disabled-looking gray switch.
- Clicking toggles active/deactivated state immediately.
- The current signed-in user cannot deactivate themselves.
- While status update is pending, show a small spinner next to the status label.
- On success, update the row in place and show a success toast.
- On failure, keep the old status and show an error toast.

Empty and loading states:

- Loading state shows a centered spinner and "Loading users...".
- Empty state shows a users icon, "No Users Found", and explanatory text.

## Security Rules

- Every protected request must be tied to an active user.
- Deactivated users must be rejected on the server, even if their browser still has a token.
- Owners can access all role-gated surfaces.
- Admins must not access owner-only user/audit/metrics surfaces.
- Access control must be enforced both in navigation and in server authorization.
- Refresh tokens must not be available to JavaScript.
- Token or credential values must never be displayed in UI, logs, or audit entries.

## Functional Acceptance Criteria

- A valid Google user can sign in and is redirected to the default module.
- A denied Google user sees a clear login error and remains unauthenticated.
- Refreshing an expired access token retries the failed action without duplicate user work.
- Failed refresh clears auth and opens the session-expired modal.
- Admin users cannot see or reach user management.
- Owner users can change another user's role.
- Owner users can activate/deactivate another user.
- Owners cannot accidentally deactivate themselves through the user table.

