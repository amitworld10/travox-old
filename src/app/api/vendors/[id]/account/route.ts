import type { NextRequest } from "next/server";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor("vendors.read.any");
    const vendor = await new PrismaVendorRepository().findById(actor, id);
    if (!vendor) throw new RouteError("Vendor not found.", 404);
    if (!vendor.account) throw new RouteError("Account not linked.", 404);
    return ok(vendor.account);
  } catch (error) {
    return fail(error);
  }
}
