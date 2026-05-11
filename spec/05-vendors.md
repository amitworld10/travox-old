# Vendors Functional Spec

## Purpose

The vendors module is the supplier master for travel services. It tracks vendors such as airlines, hotels, rail/bus/cab providers, DMCs, visa services, insurance providers, and other suppliers. Vendors are used in booking attribution, expense recording, refund tracking, account linkage, and vendor reports.

## Primary User Goals

- Create a vendor before recording supplier expense or linking a booking.
- Search vendors by name, service type, or contact person.
- Edit vendor contact and service classification.
- Link a vendor payout account.
- See linked account coverage and visible vendor volume.
- Navigate to vendor report.
- Delete obsolete vendors while preserving historical transaction integrity.

## Main Screen

Top controls:

- Page title: "Vendor Management".
- Description: says the screen manages service providers, contacts, and payout-linked account visibility.
- Report button: navigates to vendor report.
- Refresh button: reloads the vendor list. Disabled while loading.
- Create Vendor button: opens vendor form in create mode.

Summary cards:

- Visible Vendors or Search Results: number of displayed vendors.
- Linked Accounts: count of displayed vendors with linked accounts.
- Visible Expense Volume: sum of displayed vendor expense totals when available.

Search:

- Search accepts vendor name, service type, and POC name.
- While searching, show a loader beside the search box.
- Search results replace the paginated list.
- Clearing search returns to normal pagination.
- Mutations invalidate cached search results so fresh records appear.

Pagination:

- Hidden during search.
- Supports 5, 10, 20, 50, and 100 rows per page.

Loading and empty states:

- Loading state shows "Loading vendors...".
- Empty list shows "No Vendors Found" and prompts creation.
- Empty search shows "No Vendors Match Your Search".

Inline errors:

- Fetch, account-load, and delete failures appear in an inline red error panel.

## Vendor Table

Expected visible information:

- Vendor name.
- Service type.
- Point-of-contact name.
- Phone/email if present.
- GSTIN if present, masked unless unmasking is permitted.
- Linked account status.
- Expense amount/volume where available.

Row actions:

- Edit: opens vendor form with selected vendor values.
- Manage Account: opens account modal for bank/UPI details.
- Delete: opens destructive confirmation.

## Vendor Form

Create mode:

- Title should read "Create Vendor".
- Required fields: vendor name and service type.
- Optional fields: POC name, phone, email, GSTIN.
- Optional account linkage should be handled by account modal or post-create flow.

Edit mode:

- Title should read "Edit Vendor".
- Pre-fill current vendor data.
- Save updates only the vendor record.
- On success, refresh list and invalidate search cache.

Service type options:

- Airline
- Hotel
- Rail
- Bus
- Cab
- DMC
- Visa
- Insurance
- Other

Validation:

- Vendor name cannot be blank.
- Service type must be selected from supported options.
- Contact fields are optional.
- GSTIN is optional and should not block creation.

## Account Modal

Purpose:

- Store payout account details for a vendor.
- Required before recording vendor expenses in the current operational flow.

Fields:

- Bank name.
- IFSC code.
- Branch name.
- Account number.
- UPI ID.
- Active/inactive where supported.

Behavior:

- If vendor has an account, load and pre-fill it before opening.
- If loading account fails, show an inline error and open with blank state only if safe.
- Saving refreshes vendors and clears account modal state.
- Closing discards unsaved edits.

## Delete Flow

UI behavior:

- Delete opens confirmation modal titled "Delete vendor?".
- Confirm button says "Delete".
- While deleting, disable repeated actions.
- On success, close modal, invalidate search cache, and refresh.
- On failure, keep the modal available and show error.

Business behavior:

- Deleted vendors should disappear from active vendor lists.
- Existing bookings/payments/reports should retain historical vendor references or show "Unknown Vendor" gracefully.
- If linked transactions make deletion unsafe, the system should block with a clear message.

## Vendor Financial Behavior

- Booking creation increments vendor booking count when a vendor is linked to the booking.
- Expense creation increases vendor expense totals when a vendor is linked.
- Inbound vendor refunds reduce expense totals.
- Vendor ledger reports should update after expenses/refunds are recorded.

## Functional Acceptance Criteria

- User can create a vendor with name and service type.
- User can search vendors by name, POC, or service type.
- User can edit vendor details.
- User can link account details and see linked account count update.
- Expense flow prevents recording vendor expense when no vendor account is linked.
- User can delete a vendor after confirmation.

