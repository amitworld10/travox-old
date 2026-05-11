# Payments, Expenses, Refunds, and Accounts Functional Spec

## Purpose

This module tracks money movement. It records customer payments against bookings, vendor/operational expenses, customer refunds, vendor refunds, and bank/UPI account details used to identify where money came from or went.

## Shared Concepts

Payment types:

- Receivable: money collected from a customer for a booking.
- Expense: money paid to a vendor or operational category.
- Outbound refund: money returned to a customer.
- Inbound refund: money received back from a vendor.

Payment modes:

- Cash
- Card
- UPI
- Netbanking
- Bank transfer
- Cheque
- Wallet
- Other

Account fields:

- Bank name.
- IFSC code.
- Branch name.
- Account number.
- UPI ID.
- Active state.

## Payment Management Screen

Purpose:

- Record and review customer receivable payments.

Top controls:

- Page title: "Payment Management".
- Refresh button: reloads payments.
- Record Payment button: opens payment modal.

Summary cards:

- Visible Payments or Search Results: displayed payment count.
- Visible Amount: sum of displayed receivable amounts.
- Receivable Records: count of loaded receivable records.

Search:

- Placeholder: "Search payments by amount, customer, or package".
- Searches by amount, package name, and customer name.
- Search results replace paginated receivables.
- Shows loader while searching.

Pagination:

- Hidden during search.
- Supports 5, 10, 20, 50, and 100 rows per page.

Table columns:

- Receipt No.: receipt number with money icon; dash if missing.
- Booking Details: package name, PNR fallback, or "Untitled Booking"; customer name below.
- Date: payment date.
- Amount: green INR amount.
- Payment Mode: colored mode badge.
- Notes: free-text note or dash.

Payment modal behavior:

- Opens with empty booking, today's date, amount 0, cash mode, blank receipt and notes.
- Selecting a booking auto-fills amount with the booking's current due amount when due is positive.
- Selecting a booking auto-generates a receipt number like `RCPT######NNN`.
- User chooses payment mode and can add receipt/notes.
- Submit is disabled or ignored while save is already in flight.

Payment validation:

- A booking must be selected.
- Selected booking's customer must have a linked account.
- Amount must be greater than zero.
- Amount cannot exceed booking due amount.

Payment success behavior:

- Create a receivable.
- Increase booking paid amount.
- Decrease booking due amount.
- Increase customer total spend.
- Refresh payments and bookings.
- Close modal and show success toast.

## Expense Management Screen

Purpose:

- Record vendor payouts and operational expenses.

Top controls:

- Page title: "Expense Management".
- Refresh button: reloads expenses.
- Record Expense button: opens expense modal.

Summary cards:

- Visible Expenses or Search Results: displayed expense count.
- Visible Spend: sum of displayed expenses.
- Vendors Available: count of loaded vendors.

Search:

- Placeholder: "Search expenses by amount or vendor".
- Searches by amount and resolved vendor name.
- Search results replace paginated expense list.

Table columns:

- Receipt No.: generated/manual expense receipt.
- Vendor: resolved vendor name or "Unlinked Vendor".
- Date: expense creation date.
- Amount: red INR amount.
- Payment Mode: colored mode badge.
- Category: expense category or dash.
- Notes: notes or dash.

Expense modal behavior:

- Opens with generated receipt number like `EXP######NNN`.
- User selects vendor.
- User selects or derives vendor account.
- User enters amount, currency, payment mode, category, notes, optional source account.

Expense validation:

- Vendor must be selected.
- Vendor must have a linked account or an explicit vendor account must be supplied.
- Amount must be greater than zero.

Expense success behavior:

- Create an expense payment.
- Increase vendor expense totals when vendor-linked.
- Refresh expenses.
- Invalidate search cache.
- Close modal and show success toast.

## Refund Management Screen

Purpose:

- Process outbound customer refunds and review refund history.

Top controls:

- Page title: "Refund Management".
- Refresh button: reloads refunds and supporting booking/customer/payment data.
- Process Refund button: opens refund dialog.

Summary cards:

- Visible Refunds or Search Results: displayed refund count.
- Visible Refund Value: sum of displayed refund amounts.
- Eligible Receivable Payments: number of loaded receivable payments that may be refunded.

Search:

- Placeholder: "Search refunds by booking, customer, or amount".
- Searches refund amount, booking package, and customer name.
- Search results replace paginated refund list.

Table columns:

- Booking Details: package and customer for the refunded booking.
- Refund Date: refund creation date.
- Amount: red INR amount.
- Mode: colored payment-mode badge.
- Reason: refund note/reason.

Refund dialog behavior:

- User selects an eligible receivable payment.
- Dialog should show enough payment/booking/customer information to avoid refunding the wrong transaction.
- User enters or confirms refund reason.
- Existing refunds are passed in so the dialog can prevent or warn about duplicate/excess refunds.

Outbound refund success behavior:

- Create outbound refund tied to original receivable.
- Update booking paid/refund status where booking-linked.
- Update customer spend where applicable.
- Refresh refunds, bookings/customers/payments support data.
- Close dialog and show success toast.

## Account Management

Accounts are reusable financial endpoints for customers and vendors.

Customer account usage:

- Required before recording a customer receivable in the current UI flow.
- Represents the customer-side source account for payment.

Vendor account usage:

- Required before recording a vendor expense in the current UI flow.
- Represents the vendor-side destination account.

Account modal behavior:

- Can create a new account and link it to a customer or vendor.
- Can load and edit an existing linked account.
- On save, refresh the owning customer/vendor list.

## Cross-Module Financial Rules

- Money operations must be org-scoped.
- Financial creates should not be treated as isolated rows; they update booking, customer, vendor, and reporting aggregates.
- Receivables cannot overpay a booking.
- Refunds should reference the original payment being refunded.
- Reports and visible totals must refresh after financial mutation.

## Functional Acceptance Criteria

- User can record a receivable only for a booking whose customer has an account.
- Receivable auto-fills from due amount and generates a receipt number.
- User can record an expense only for a vendor with an account.
- Expense generates a receipt number and shows in expense table.
- User can process an outbound refund from an eligible receivable.
- Search works independently in payments, expenses, and refunds.
- Visible stat cards update after create/refund operations.

