import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaFileRepository } from "@/modules/files/infrastructure/prisma-file-repository";
import { updateFileSchema } from "@/modules/files/presentation/schemas/file-schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor("files.read.any");
    const { id } = await params;
    const data = await new PrismaFileRepository().findById(actor, id);
    if (!data) throw new RouteError("File not found.", 404);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor("files.update.any");
    const { id } = await params;
    const input = updateFileSchema.parse(await request.json());
    const data = await new PrismaFileRepository().update(actor, id, input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor("files.delete.any");
    const { id } = await params;
    await new PrismaFileRepository().delete(actor, id);
    return ok({ message: "File deleted successfully." });
  } catch (error) {
    return fail(error);
  }
}
