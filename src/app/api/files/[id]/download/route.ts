import { requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaFileRepository } from "@/modules/files/infrastructure/prisma-file-repository";
import { downloadHeaders } from "@/modules/files/presentation/http/file-route-helpers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor("files.download.any");
    const { id } = await params;
    const file = await new PrismaFileRepository().download(actor, id);
    return new Response(new Uint8Array(file.bytes), { headers: downloadHeaders(file.name, file.mimeType, file.size) });
  } catch (error) {
    return Response.json({ status: "error", message: error instanceof Error ? error.message : "Download failed." }, { status: 400 });
  }
}
