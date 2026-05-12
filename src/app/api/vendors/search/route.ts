import type { NextRequest } from "next/server";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("vendors.read.any");
    const { searchParams } = new URL(request.url);
    const data = await new PrismaVendorRepository().list(actor, {
      limit: Number(searchParams.get("limit") ?? 50),
      offset: Number(searchParams.get("offset") ?? 0),
      q: searchParams.get("q") ?? undefined,
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
