# Reports and Ledgers Functional Spec

## Purpose

Reports turn operational records into exportable financial and travel views. Users can choose a report, filter the data, inspect totals, review rows, and export to CSV, spreadsheet-compatible XML, or print/PDF.

## Report Catalog

The report center should present a catalog of available reports grouped by category. Each report should have:

- Name.
- Description.
- Category.
- Route/action to run the report.
- Optional experimental or legacy indication if applicable.

Supported report concepts:

- Sales by customer detail.
- Customer balance detail.
- Customer payment details.
- Payment details by customer.
- Customer ledger.
- Invoice and credit note list by date.
- Invoice list.
- Invoices by month.
- Sales by product/service detail.
- Transaction list by customer.
- Transaction list by date.
- Payment splits by customer.
- Vendor ledger.
- Outstanding payments.
- Monthly income/expense.
- Refund register.
- Booking register.
- GST/tax view.

## Report Runner Screen

Top controls:

- Page title: selected report label.
- Description: selected report description or generic report-running copy.
- Refresh button: reruns the current report with current filters.
- Export button: opens export menu.

Export menu:

- Export CSV: downloads comma-separated report data.
- Export XML (.xls): downloads spreadsheet-compatible XML.
- Print / PDF: opens a print-ready report output if report metadata is available.
- Selecting an export action closes the export menu.

Default behavior:

- On first load, set date range from three months ago to today.
- Load report catalog and entity filter options.
- Automatically run the report once initialization completes.
- Reset report-specific filters when report ID changes.

## Filter Panel

Always available:

- Start date.
- End date.
- Search rows.

Conditionally available by report:

- Customer dropdown: "All customers" plus customer names.
- Vendor dropdown: "All vendors" plus vendor names.
- Transaction type dropdown: All, Invoice, Payment, Credit Memo.
- Payment mode dropdown: Cash, Card, UPI, Netbanking, Bank Transfer, Cheque, Wallet, Other.
- Product/service dropdown: Air Ticket, Railway Ticket, Bus Ticket, Hotel Booking, Cab Service, Tour Package, Visa Service, Travel Service.
- Pending only checkbox.
- Include refunds checkbox.
- Include payment details checkbox.
- Include zero balance checkbox.

Apply Filters button:

- Runs the report using current filter values.
- Converts selected values into report query filters.
- Keeps filter controls visible after running.

## Totals Cards

After a report loads, show up to six totals from report metadata.

Behavior:

- Convert camelCase keys into readable labels.
- Format number values using Indian number formatting.
- Hide totals section when no metadata/totals exist.

## Report Table

Table behavior:

- Columns come from the report result.
- Column label, type, and alignment control rendering.
- Date values display as Indian locale dates.
- Currency values display as INR with up to two decimals.
- Number values use Indian number grouping.
- Empty values display as dash.
- Large result sets are scrollable within the table container.

Loading and empty states:

- While loading, show a centered large spinner.
- If no rows match filters, show "No rows found for the selected filters."

## Ledger Semantics

Customer ledger concepts:

- Booking invoice increases customer balance.
- Customer payment decreases customer balance.
- Customer refund/credit memo decreases customer balance.
- Opening balance is computed from transactions before the selected start date.
- Closing balance is computed after applying interval transactions.

Vendor ledger concepts:

- Vendor expense increases vendor payable/expense amount.
- Vendor refund decreases vendor expense amount.
- Opening/closing balance behavior mirrors customer ledgers where applicable.

Outstanding payments:

- Shows bookings or customer balances with amount still due.
- Pending-only filters should remove fully paid records.

Monthly income/expense:

- Groups receivables/expenses/refunds by month.
- Should expose totals that make cashflow direction clear.

Refund register:

- Shows refund transactions with amount, date, mode, and references.

Booking register:

- Shows booking-level operational data: booking date, customer, vendor, service, status, pax, total, paid, due, travel dates.

GST/tax view:

- Derives rows from booking/invoice-like data.
- If canonical GST split data is absent, GST component columns should remain blank rather than fabricate legal tax numbers.

## Search Behavior

- Search should apply to meaningful row fields for the selected report.
- It should not change the selected filters.
- Empty search returns all rows matching non-search filters.

## Functional Acceptance Criteria

- User can open report center and choose a report.
- Report runner initializes with a three-month date range.
- User can filter by date and report-specific filters.
- User can apply filters and see updated totals/table rows.
- User can export CSV.
- User can export spreadsheet-compatible XML.
- User can print or save as PDF when metadata exists.
- Report rows display dates/currency/numbers in readable formats.
- GST view does not invent tax splits when source data is missing.

