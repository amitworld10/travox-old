import type { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { customerInputSchema } from "@/modules/customers/presentation/schemas/customer-schemas";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("customers.read.any");
    const { searchParams } = new URL(request.url);
    const data = await new PrismaCustomerRepository().list(actor, {
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
    const actor = await requireActor("customers.create.any");
    const input = customerInputSchema.parse(await request.json());
    const data = await new PrismaCustomerRepository().create(actor, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
