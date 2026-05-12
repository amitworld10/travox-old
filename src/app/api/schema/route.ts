import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { getOcrSchema, ocrSchemaVersion } from "@/modules/ocr/application/ocr-schema";

export async function GET() {
  try {
    await requireActor("ocr.scan.any");
    return ok({ version: ocrSchemaVersion, schema: getOcrSchema() });
  } catch (error) {
    return fail(error);
  }
}
