import type { NextRequest } from "next/server";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";
import { vendorInputSchema } from "@/modules/vendors/presentation/schemas/vendor-schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("vendors.read.any");
    const data = await new PrismaVendorRepository().findById(actor, id);
    if (!data) throw new RouteError("Vendor not found.", 404);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("vendors.update.any");
    const input = vendorInputSchema.partial().parse(await request.json());
    const data = await new PrismaVendorRepository().update(actor, id, input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("vendors.delete.any");
    await new PrismaVendorRepository().softDelete(actor, id);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}
