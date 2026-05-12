import type { NextRequest } from "next/server";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";
import { vendorInputSchema } from "@/modules/vendors/presentation/schemas/vendor-schemas";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("vendors.read.any");
    const { searchParams } = new URL(request.url);
    const data = await new PrismaVendorRepository().list(actor, {
      limit: Number(searchParams.get("limit") ?? 10),
      offset: Number(searchParams.get("offset") ?? 0),
      q: searchParams.get("q") ?? undefined,
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActor("vendors.create.any");
    const input = vendorInputSchema.parse(await request.json());
    const data = await new PrismaVendorRepository().create(actor, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
