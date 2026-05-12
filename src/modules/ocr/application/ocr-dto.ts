export type OcrConfidence = "HIGH" | "MEDIUM" | "LOW";

export type OcrExtractedBooking = {
  packageName?: string;
  pnrNo?: string;
  bookingDate?: string;
  totalAmount?: number;
  currency?: string;
  modeOfJourney?: string;
  pax: Array<{
    paxName: string;
    paxType: string;
    sex?: string;
    passportNo?: string;
    dob?: string;
  }>;
  itineraries: Array<{
    name: string;
    seqNo: number;
    segments: Array<Record<string, unknown> & { seqNo: number; modeOfJourney: string }>;
  }>;
  vendorInfo?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  extractionConfidence: OcrConfidence;
  extractedFields: string[];
  notes?: string;
  schemaVersion: string;
};

export type OcrResultDto = {
  jobId?: string;
  fileId?: string;
  fileName: string;
  booking: OcrExtractedBooking;
  message: string;
};
