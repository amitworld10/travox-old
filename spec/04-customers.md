# Customers Functional Spec

## Purpose

The customers module is the workspace's customer master. It stores traveller/customer identity, contact details, document numbers, GST information, account linkage, booking history visibility, and spend summaries. Operators use it before creating bookings, recording payments, and reviewing customer-level travel history.

## Primary User Goals

- Create a customer quickly before making a booking.
- Search for an existing customer by name or identifying details.
- Edit contact, document, or GST details.
- Link or update a bank/UPI account used for payment workflows.
- See customer spend and linked account coverage at a glance.
- Open a customer's booking history.
- Delete a duplicate or obsolete customer record.
- Navigate to customer reports.

## Main Screen

Top controls:

- Page title: "Customer Management".
- Description: states that this screen manages records, linked bookings, and account visibility.
- Report button: navigates to the customer report screen.
- Refresh button: reloads the paginated customer list. Disabled while loading.
- Create Customer button: opens the customer form in create mode.

Summary cards:

- Visible Customers or Search Results: number of rows currently displayed.
- Total Visible Spend: sum of `totalSpent` for displayed rows, formatted in INR.
- Linked Accounts: count of displayed customers with a linked account.

Search:

- Search box filters customers through the search endpoint after a short debounce.
- Search is cancellable so fast typing does not apply stale results.
- Search results are sorted by most recently updated first.
- While searching, show a small loader next to the search field.
- When search text is present, pagination is hidden and search results replace the paginated list.
- Clearing search returns to the paginated list.

Pagination:

- Shown only for the normal list, not search results.
- Supports 5, 10, 20, 50, and 100 rows per page.
- Page and page size changes reload the list.

Loading state:

- Shows a centered spinner with "Loading customers...".

Empty states:

- No customers: show "No Customers Found" and tell the user to add the first customer.
- No search results: show "No Customers Match Your Search" and tell the user to try another keyword or clear search.

Inline errors:

- Any fetch/search/delete error appears in a red inline panel above the table.

## Customer Table

The table should let users scan records and act without opening a detail page.

Expected visible information:

- Customer name.
- Contact details such as phone and email where available.
- Document/GST identifiers where available, masked unless unmasking is permitted.
- Booking count or booking-related context.
- Total spend.
- Account linkage status.
- Created/updated context when useful.

Row actions:

- Edit: opens the customer form in edit mode with the selected customer's current values.
- Delete: opens a destructive confirmation modal.
- View bookings/history: opens a bookings modal for the selected customer.
- Manage account, if exposed in the row: opens account modal for linked bank/UPI details.

## Customer Form

Create mode:

- Title should read "Create Customer".
- Required field: customer name.
- Optional contact fields: phone and email.
- Optional identity fields: passport number, Aadhaar number, visa number.
- Optional tax field: GSTIN.
- Optional account linkage may be handled separately through the account modal.
- Save creates a new customer and refreshes list/search results.
- Cancel closes without saving.

Edit mode:

- Title should read "Edit Customer".
- Pre-fill existing values.
- Save updates changed fields.
- Cancel keeps the original record.
- After save, refresh the visible list and active search results.

Validation:

- Name cannot be blank.
- Email should be accepted only in a valid email shape if validation is implemented.
- Phone should preserve meaningful user formatting but not accept empty-as-real data.
- Document numbers are optional; do not block customer creation because a document is missing.

## Account Modal

The customer account modal links payment account details to a customer.

Fields:

- Bank name.
- IFSC code.
- Branch name.
- Account number.
- UPI ID.
- Active/inactive state where supported.

Behavior:

- If the customer already has an account, load existing account details before opening.
- If no account exists, open an empty form.
- Saving links the account to the customer and refreshes the customer list.
- Closing discards unsaved account edits.

## Customer Bookings Modal

Purpose:

- Show bookings associated with one customer without leaving customer management.

Behavior:

- Opens from a selected customer row.
- Shows booking rows or an empty state.
- Should include enough booking information to identify travel: package/PNR, dates, status, amount, paid/due.
- Closing returns to the customer list unchanged.

## Delete Flow

UI behavior:

- Clicking delete opens a confirmation modal titled "Delete customer?".
- The modal warns that the customer record will be removed.
- Confirm button says "Delete".
- While deleting, prevent closing or double submission.
- On success, close modal, clear delete target, refresh list/search.
- On failure, keep modal open and show error.

Business behavior:

- Deletion should be non-destructive where the data model supports soft delete.
- Deleted customers should disappear from active lists and searches.
- If a customer has bookings or payments, the product should either block deletion with a useful error or preserve historical references.

## Customer Financial Behavior

- Creating a booking increments the customer's booking count.
- Recording a receivable increases customer spend.
- Processing an outbound refund may reduce customer spend according to refund rules.
- Reports should reflect booking, payment, and refund changes after refresh.

## Functional Acceptance Criteria

- User can create a customer with only required fields.
- User can search customers and clear search back to the normal list.
- User can edit a customer and see the update without full app reload.
- User can link an account and see linked account count update.
- User can open a customer's booking history.
- User can delete a customer after confirmation.
- Sensitive document fields are not exposed unless the user/request is allowed to unmask.

