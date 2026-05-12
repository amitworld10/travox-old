import type { OcrExtractedBooking } from "../application/ocr-dto";

export type OcrProviderPort = {
  extract(input: { bytes: Buffer; mimeType: string; fileName: string }): Promise<OcrExtractedBooking>;
  health(): Promise<{ configured: boolean; engine: string; message: string }>;
};
