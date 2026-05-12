import type { NextRequest } from "next/server";
import { PrismaAccountRepository } from "@/modules/accounts/infrastructure/prisma-account-repository";
import { accountInputSchema } from "@/modules/accounts/presentation/schemas/account-schemas";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function GET() {
  try {
    const actor = await requireActor("accounts.read.any");
    const data = await new PrismaAccountRepository().list(actor);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActor("accounts.create.any");
    const input = accountInputSchema.parse(await request.json());
    const data = await new PrismaAccountRepository().create(actor, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
