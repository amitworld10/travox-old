# Files and OCR Functional Spec

## Purpose

Files and OCR support document-driven travel operations. Users can upload travel documents, store/download them, and scan documents to extract structured booking data for review and booking prefill.

## File Storage Functionality

Supported file purposes:

- Ticket.
- Invoice.
- Voucher.
- Passport.
- Visa.
- Other.

Stored metadata:

- File name.
- MIME type.
- Size.
- Kind/purpose.
- Storage identifier.
- Uploader.
- Upload timestamp.
- Workspace ownership.

User actions:

- Upload a file.
- List files.
- View file metadata.
- Download a file.
- Update file metadata such as name/kind.
- Delete a file.

Storage behavior:

- The user should not need to know whether files are stored locally or in cloud storage.
- Download should return the exact file that was uploaded.
- Delete should remove or detach the stored object and metadata according to retention rules.
- File operations must be authenticated and workspace-scoped.

## OCR Scan Functionality

Purpose:

- Read travel documents and extract booking-related structured data.
- Reduce manual entry for PAX and itinerary details.
- Keep human review in control before a booking is created or updated.

Supported source documents:

- Flight tickets.
- Hotel vouchers.
- Travel invoices.
- Visa/passport-related documents.
- Mixed itinerary documents.
- Images or PDFs, depending on accepted MIME handling.

## OCR Output

The scan output should include:

- Booking summary: package name, PNR/reference, booking date, total amount, currency, journey mode.
- Passenger data: passenger name, type, sex, passport number, date of birth.
- Itinerary data: itinerary name, sequence number, segment list.
- Segment data: mode, carrier/operator/service number, departure/arrival codes, departure/arrival times, class, baggage, hotel name/address, check-in/out, room type, meal plan, boarding/drop points, and miscellaneous extracted fields.
- Vendor information: vendor/supplier name and contact details when present.
- Confidence: high, medium, or low.
- Extracted field list: fields the OCR believes it found.
- Notes: ambiguity, missing data, warnings, or extraction assumptions.
- Schema version: identifies which extraction schema shaped the output.

## OCR User Journey

1. User chooses a document to scan.
2. UI uploads the document or sends it directly for scanning.
3. System shows scanning/loading state.
4. OCR returns structured data.
5. UI presents extracted fields for review.
6. User corrects missing or incorrect values.
7. User confirms the data into a booking form.
8. Booking is created or updated only after user confirmation.

Important rule:

- OCR must not silently create a booking. It should produce a prefill draft that the user can inspect and submit.

## OCR Validation Behavior

- Missing PAX array should normalize to an empty list.
- Missing itineraries array should normalize to an empty list.
- Missing extracted fields should normalize to an empty list.
- Missing itinerary names should become "Itinerary 1", "Itinerary 2", and so on.
- Missing sequence numbers should be generated from row order.
- Invalid PAX type should default to adult only if the extracted value cannot be trusted.
- Invalid segment mode should default to Other.
- Validation warnings should lower confidence and appear in notes.
- A passenger with no name should be treated as invalid and require user correction.

## OCR Review UI Requirements

The review UI should make uncertainty obvious.

Recommended UI elements:

- File preview or file name summary.
- Confidence badge.
- Extracted fields checklist or highlighted field count.
- Warnings/notes panel.
- Editable booking details section.
- Editable passenger table.
- Editable itinerary/segment sections.
- "Use in Booking" or "Create Draft Booking" action.
- Cancel/discard action.
- Retry scan action for failed/low-quality scans.

## Error States

- Unsupported file type: show clear message before upload or scan.
- Missing OCR API key/service unavailable: show "OCR service unavailable" style error.
- Model returns invalid JSON: show extraction failed and allow retry/manual entry.
- Low confidence: allow use but require manual review cues.
- Upload failure: preserve local form state and allow retry.

## Functional Acceptance Criteria

- User can upload and download a file.
- File metadata shows kind, name, size, and upload context.
- User can scan a travel document and receive structured booking-like data.
- OCR warnings are visible to the user.
- OCR never creates final booking data without user confirmation.
- Extracted passenger and segment data can be corrected before submission.
- Failed scans do not corrupt existing booking form data.

