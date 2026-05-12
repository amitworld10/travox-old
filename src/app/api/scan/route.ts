import type { NextRequest } from "next/server";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaOcrService } from "@/modules/ocr/infrastructure/prisma-ocr-service";
import { ocrUploadInputFromRequest } from "@/modules/ocr/presentation/http/ocr-route-helpers";

export async function GET() {
  try {
    await requireActor("ocr.scan.any");
    const data = await new PrismaOcrService().health();
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActor("ocr.scan.any");
    const fileId = request.nextUrl.searchParams.get("fileId");
    const data = fileId
      ? await new PrismaOcrService().scanFile(actor, fileId)
      : await new PrismaOcrService().scanUpload(actor, await ocrUploadInputFromRequest(request));
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
