import type { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor("customers.read.any");
    const data = await new PrismaCustomerRepository().bookings(actor, id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
