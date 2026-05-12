import "server-only";
import type { OcrProviderPort } from "../domain/ocr-provider";
import type { OcrExtractedBooking } from "../application/ocr-dto";
import { getOcrPrompt } from "../application/ocr-schema";
import { normalizeOcrData } from "../application/normalize-ocr";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export class GeminiOcrProvider implements OcrProviderPort {
  private readonly apiKey = process.env.GEMINI_API_KEY;

  async health() {
    return {
      configured: Boolean(this.apiKey),
      engine: "gemini-2.5-flash",
      message: this.apiKey ? "OCR service configured." : "OCR service unavailable. Set GEMINI_API_KEY.",
    };
  }

  async extract(input: { bytes: Buffer; mimeType: string; fileName: string }): Promise<OcrExtractedBooking> {
    if (!this.apiKey) throw new Error("OCR service unavailable. Set GEMINI_API_KEY.");
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${getOcrPrompt()}\n\nDocument name: ${input.fileName}` },
              { inlineData: { mimeType: input.mimeType, data: input.bytes.toString("base64") } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!response.ok) throw new Error(`OCR extraction failed: Gemini returned ${response.status}.`);
    const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!text) throw new Error("OCR extraction failed: Gemini returned no JSON text.");
    return normalizeOcrData(JSON.parse(cleanJson(text)));
  }
}

function cleanJson(text: string) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return start >= 0 && end >= start ? trimmed.slice(start, end + 1) : trimmed;
}
