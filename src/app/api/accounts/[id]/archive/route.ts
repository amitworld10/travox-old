import type { NextRequest } from "next/server";
import { PrismaAccountRepository } from "@/modules/accounts/infrastructure/prisma-account-repository";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireActor("accounts.update.any");
    await new PrismaAccountRepository().archive(actor, id);
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}
