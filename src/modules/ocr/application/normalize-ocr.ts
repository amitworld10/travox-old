import { ocrSchemaVersion } from "./ocr-schema";
import type { OcrExtractedBooking } from "./ocr-dto";

const paxTypes = new Set(["ADT", "CHD", "INF"]);
const sexes = new Set(["M", "F", "T"]);
const modes = new Set(["FLIGHT", "TRAIN", "BUS", "HOTEL", "CAB", "OTHER"]);

export function normalizeOcrData(raw: unknown): OcrExtractedBooking {
  const data = isRecord(raw) ? raw : {};
  const notes: string[] = [];
  const pax = Array.isArray(data.pax)
    ? data.pax
        .filter(isRecord)
        .map((item, index) => {
          const paxName = asString(item.paxName);
          if (!paxName) notes.push(`Passenger ${index + 1} is missing a name.`);
          const paxType = paxTypes.has(asString(item.paxType)) ? asString(item.paxType) : "ADT";
          const sex = sexes.has(asString(item.sex)) ? asString(item.sex) : undefined;
          return { paxName, paxType, sex, passportNo: asString(item.passportNo) || undefined, dob: asString(item.dob) || undefined };
        })
    : [];

  const itineraries = Array.isArray(data.itineraries)
    ? data.itineraries.filter(isRecord).map((itinerary, index) => ({
        name: asString(itinerary.name) || `Itinerary ${index + 1}`,
        seqNo: asNumber(itinerary.seqNo) || index + 1,
        segments: Array.isArray(itinerary.segments)
          ? itinerary.segments.filter(isRecord).map((segment, segmentIndex) => ({
              ...segment,
              seqNo: asNumber(segment.seqNo) || segmentIndex + 1,
              modeOfJourney: modes.has(asString(segment.modeOfJourney)) ? asString(segment.modeOfJourney) : "OTHER",
            }))
          : [],
      }))
    : [];

  const extractedFields = Array.isArray(data.extractedFields) ? data.extractedFields.map(String) : [];
  const confidence = data.extractionConfidence === "HIGH" || data.extractionConfidence === "LOW" || data.extractionConfidence === "MEDIUM" ? data.extractionConfidence : "MEDIUM";
  const existingNotes = asString(data.notes);

  return {
    packageName: asString(data.packageName) || undefined,
    pnrNo: asString(data.pnrNo) || undefined,
    bookingDate: asString(data.bookingDate) || undefined,
    totalAmount: asNumber(data.totalAmount) || undefined,
    currency: asString(data.currency) || undefined,
    modeOfJourney: asString(data.modeOfJourney) || undefined,
    pax,
    itineraries,
    vendorInfo: isRecord(data.vendorInfo)
      ? { name: asString(data.vendorInfo.name) || undefined, contact: asString(data.vendorInfo.contact) || undefined, email: asString(data.vendorInfo.email) || undefined }
      : undefined,
    extractionConfidence: notes.length && confidence === "HIGH" ? "MEDIUM" : confidence,
    extractedFields,
    notes: [existingNotes, ...notes].filter(Boolean).join("\n") || undefined,
    schemaVersion: ocrSchemaVersion,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}
