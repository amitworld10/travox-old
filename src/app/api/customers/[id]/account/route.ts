import type { NextRequest } from "next/server";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor("customers.read.any");
    const customer = await new PrismaCustomerRepository().findById(actor, id);
    if (!customer) throw new RouteError("Customer not found.", 404);
    if (!customer.account) throw new RouteError("Account not linked.", 404);
    return ok(customer.account);
  } catch (error) {
    return fail(error);
  }
}
