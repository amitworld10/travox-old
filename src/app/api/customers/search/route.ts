import type { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("customers.read.any");
    const { searchParams } = new URL(request.url);
    const data = await new PrismaCustomerRepository().list(actor, {
      limit: Number(searchParams.get("limit") ?? 50),
      offset: Number(searchParams.get("offset") ?? 0),
      q: searchParams.get("q") ?? undefined,
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
