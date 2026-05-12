import type { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { customerInputSchema } from "@/modules/customers/presentation/schemas/customer-schemas";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("customers.read.any");
    const data = await new PrismaCustomerRepository().findById(actor, id);
    if (!data) throw new RouteError("Customer not found.", 404);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("customers.update.any");
    const input = customerInputSchema.partial().parse(await request.json());
    const data = await new PrismaCustomerRepository().update(actor, id, input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("customers.delete.any");
    await new PrismaCustomerRepository().softDelete(actor, id);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}
