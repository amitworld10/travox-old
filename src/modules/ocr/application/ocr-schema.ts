export const ocrSchemaVersion = "v-next-files-ocr-1";

export function getOcrSchema() {
  return {
    packageName: "string optional",
    pnrNo: "string optional",
    bookingDate: "ISO date string optional",
    totalAmount: "positive number optional",
    currency: "currency code optional",
    modeOfJourney: "FLIGHT|TRAIN|BUS|HOTEL|CAB|OTHER optional",
    pax: [{ paxName: "string required", paxType: "ADT|CHD|INF", sex: "M|F|T optional", passportNo: "string optional", dob: "ISO date optional" }],
    itineraries: [{ name: "string", seqNo: "number", segments: [{ seqNo: "number", modeOfJourney: "FLIGHT|TRAIN|BUS|HOTEL|CAB|OTHER" }] }],
    vendorInfo: { name: "string optional", contact: "string optional", email: "string optional" },
    extractionConfidence: "HIGH|MEDIUM|LOW",
    extractedFields: ["dot.notation.field.names"],
    notes: "string optional",
    schemaVersion: ocrSchemaVersion,
  };
}

export function getOcrPrompt() {
  return `Extract structured travel booking data from this document. Return only valid JSON matching this schema:
${JSON.stringify(getOcrSchema(), null, 2)}

Rules:
- Do not create a booking. Return a reviewable prefill draft only.
- Normalize missing pax, itineraries, and extractedFields to arrays.
- Use ADT for untrusted passenger type.
- Use OTHER for untrusted segment mode.
- Add warnings or ambiguity to notes and lower confidence when uncertain.`;
}
