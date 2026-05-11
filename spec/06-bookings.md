# Bookings Functional Spec

## Purpose

Bookings are the core operational record in Travox. A booking connects a customer, passengers, itinerary, travel segments, vendor, PNR/package details, travel dates, status, total amount, paid amount, and due amount. It is the source for customer ledgers, revenue reporting, payments, refunds, and reminders.

## Primary User Goals

- Create a booking for a customer with one or more passengers.
- Add transport/hotel/cab/other itinerary segments.
- Capture PNR, package name, booking date, travel dates, amount, vendor, and status.
- Search or filter existing bookings.
- View complete booking details without editing.
- Edit a booking when details change.
- Delete obsolete or incorrect bookings after confirmation.
- Track paid and due amount.
- See booking-level stats for operational monitoring.

## Main Screen

Top controls:

- Page title: "Booking Management".
- Description: references bookings, OCR-prefill records, and status-driven reservation workflows.
- Refresh button: reloads bookings and booking stats. Disabled while list/stats are loading.
- Create Booking button: opens booking form in create mode.

Summary cards:

- Total Bookings: total count from booking stats.
- Confirmed: count of confirmed bookings.
- Revenue: total revenue amount formatted in INR.
- Pending: total pending amount formatted in INR.

Search and filtering:

- Search field placeholder: "Search bookings by package, customer, or amount".
- Search is debounced and cancellable.
- Search clears active filters.
- Filter dropdown clears active search.
- Result priority is search results first, filter results second, normal paginated bookings third.

Pagination:

- Hidden during search and filtering.
- Supports 5, 10, 20, 50, and 100 rows per page.

Loading states:

- Normal load: "Loading bookings...".
- Search load: "Searching...".
- Filter load: "Filtering...".

Empty states:

- No bookings: "No Bookings Found" and prompt to create first booking.
- No search: "No Bookings Match Your Search".
- No filters: "No Bookings Match Current Filters".

## Booking Table

Header note:

- Shows number of displayed bookings.
- Gives a tip about narrowing by status, payment state, date, or due amount.

Columns:

- Package: package name; show PNR below in monospace when available.
- Customer: resolved customer name.
- Booking Date: date booking was created/recorded.
- Travel Start: derived from first valid segment departure/check-in.
- Travel End: derived from latest valid segment arrival/check-out.
- Pax: number of passengers, shown as "person" or "people".
- Amount: total amount, paid amount, and due amount if due is greater than zero.
- Status: badge with status in uppercase.
- Actions: View, Edit, Delete.

Status badge tones:

- Success: Confirmed, Ticketed, Completed.
- Warning: Draft, In Progress.
- Danger: Cancelled, Refunded.
- Default: unknown or unsupported status.

Row action behavior:

- View: opens modal in read-only mode and loads full booking details.
- Edit: opens modal in edit mode and loads full booking details.
- Delete: opens confirmation modal.

## Filter Dropdown

Filter button:

- Shows a filter icon and "Filters".
- When any filter is active, button uses active styling and displays a count badge.
- Clicking outside closes the dropdown.

Supported filters:

- Booking Status: All, Draft, Confirmed, Ticketed, In Progress, Completed, Cancelled, Refunded.
- Payment Status: All, Paid, Partial, Unpaid.
- Due Amount minimum.
- Due Amount maximum.
- Booking Date from/to.
- Travel Start from/to with date-time precision.
- Travel End from/to with date-time precision.

Actions:

- Apply: sends only non-empty filters.
- Clear: resets local filter values and returns to normal list. Shown only when filters are active.

## Booking Modal and Form Modes

Create mode:

- Modal title: "Create Booking".
- Empty booking form.
- Saving sends a create request.
- On success, show "Booking added", refresh bookings and stats, then close.

Edit mode:

- Modal title: "Edit Booking".
- Loads selected booking details before rendering editable form.
- Saving sends an update request.
- On success, show "Booking updated", refresh bookings and stats, then close.

View mode:

- Modal title: "View Booking".
- Loads selected booking details.
- Fields should be displayed read-only.
- No mutation should occur from read-only mode.

Shared modal states:

- While customers are loading, show "Loading customers...".
- If customer loading fails, show an inline error.
- While booking details are loading, show "Loading booking details...".
- If detail loading fails, show an inline error.

## Booking Form Sections

The form should be organized around these functional groups:

- Customer selection: choose an existing customer or create a new customer inline if supported.
- Basic booking details: package name, PNR, booking date, currency, total amount, advance amount, status, vendor.
- Passengers: one or more PAX rows with name, PAX type, sex, passport, and date of birth.
- Itineraries: one or more itinerary groups with name and sequence.
- Segments: mode-specific travel rows inside itineraries.
- Financial summary: total, paid/advance, due.
- Footer actions: save/update, cancel/close.

Customer selection:

- Searchable dropdown should show customer matches.
- Booking cannot be saved without a customer.
- Inline customer creation should add the new customer to the selectable list and select it.

PAX behavior:

- At least one passenger is required.
- Each passenger requires name and type.
- Supported PAX types: ADT, CHD, INF.
- Passenger count derives from the number of PAX rows.
- Primary passenger derives from the first passenger.

Segment behavior:

- Each segment requires sequence and mode.
- FLIGHT requires departure code.
- HOTEL requires hotel name.
- TRAIN and BUS require departure code or boarding point.
- CAB and OTHER can be saved with minimal details.
- Departure/check-in dates contribute to travel start.
- Arrival/check-out dates contribute to travel end.

Financial behavior:

- Total amount must be greater than zero.
- Advance/paid amount cannot exceed total amount.
- Due amount is total minus paid, adjusted by later receivables/refunds.
- Recording payments happens in the payments module, not directly from the booking table.

## Status Lifecycle

Statuses:

- Draft: early/incomplete booking.
- Confirmed: customer/supplier confirmation exists.
- Ticketed: at least one ticket/travel segment is issued.
- In Progress: travel is underway or active.
- Completed: travel is complete and dues are cleared unless overridden.
- Cancelled: booking is cancelled.
- Refunded: booking has been fully refunded or paid amount was reduced to zero through refund behavior.

Rules:

- Confirming requires at least one passenger.
- Ticketing requires at least one segment.
- Completing normally requires travel end to be in the past and due amount to be zero.
- Refunded bookings should not show outstanding due.

## Delete Flow

- Delete opens modal titled "Delete booking?".
- Confirm button says "Yes, delete".
- While deleting, prevent duplicate submission.
- On success, show "Booking deleted", close modal, refresh bookings and stats.
- On failure, show error in the modal.

## Functional Acceptance Criteria

- User can create a booking with customer, positive amount, and one passenger.
- User cannot save invalid PAX or mode-specific segment data.
- Search and filter are mutually exclusive and produce predictable displayed rows.
- View mode does not mutate data.
- Edit mode reloads the full booking before allowing save.
- Booking stats update after create, update, and delete.
- Paid/due display matches payment state after refresh.

