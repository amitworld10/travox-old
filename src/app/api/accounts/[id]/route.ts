import type { NextRequest } from "next/server";
import { PrismaAccountRepository } from "@/modules/accounts/infrastructure/prisma-account-repository";
import { accountInputSchema } from "@/modules/accounts/presentation/schemas/account-schemas";
import { fail, ok, requireActor, RouteError } from "@/modules/master-data/presentation/http/master-data-route-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("accounts.read.any");
    const data = await new PrismaAccountRepository().findById(actor, id);
    if (!data) throw new RouteError("Account not found.", 404);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("accounts.update.any");
    const input = accountInputSchema.parse(await request.json());
    const data = await new PrismaAccountRepository().update(actor, id, input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await requireActor("accounts.delete.any");
    await new PrismaAccountRepository().softDelete(actor, id);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}
