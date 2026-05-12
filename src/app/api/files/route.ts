import type { NextRequest } from "next/server";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaFileRepository } from "@/modules/files/infrastructure/prisma-file-repository";
import { createFileInputFromRequest, fileFiltersFromRequest } from "@/modules/files/presentation/http/file-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("files.read.any");
    const data = await new PrismaFileRepository().list(actor, fileFiltersFromRequest(request));
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActor("files.upload.any");
    const input = await createFileInputFromRequest(request);
    const data = await new PrismaFileRepository().create(actor, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
