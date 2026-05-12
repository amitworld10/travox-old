import type { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor("customers.read.any");
    const customer = await new PrismaCustomerRepository().findById(actor, id);
    if (!customer) throw new RouteError("Customer not found.", 404);
    return ok({ totalBookings: customer.totalBookings, totalSpent: customer.totalSpent, linkedAccount: Boolean(customer.accountId) });
  } catch (error) {
    return fail(error);
  }
}
