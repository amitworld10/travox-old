"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/modules/auth/presentation/http/current-actor";
import { AuthorizationService } from "@/modules/authorization/application/authorization-service";
import type { PermissionCode } from "@/modules/authorization/domain/permissions";
import { PrismaAccountRepository } from "@/modules/accounts/infrastructure/prisma-account-repository";
import { accountInputSchema } from "@/modules/accounts/presentation/schemas/account-schemas";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { customerInputSchema } from "@/modules/customers/presentation/schemas/customer-schemas";
import { PrismaVendorRepository } from "@/modules/vendors/infrastructure/prisma-vendor-repository";
import { vendorInputSchema } from "@/modules/vendors/presentation/schemas/vendor-schemas";

export type MasterDataActionResult<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message: string };

export async function saveCustomerAction(input: unknown, id?: string): Promise<MasterDataActionResult> {
  try {
    const actor = await requireActor(id ? "customers.update.any" : "customers.create.any");
    const data = customerInputSchema.parse(input);
    const repo = new PrismaCustomerRepository();
    const customer = id ? await repo.update(actor, id, data) : await repo.create(actor, data);
    revalidatePath("/customers");
    return { ok: true, data: customer, message: id ? "Customer updated." : "Customer created." };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteCustomerAction(id: string): Promise<MasterDataActionResult> {
  try {
    const actor = await requireActor("customers.delete.any");
    await new PrismaCustomerRepository().softDelete(actor, id);
    revalidatePath("/customers");
    return { ok: true, message: "Customer deleted." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveVendorAction(input: unknown, id?: string): Promise<MasterDataActionResult> {
  try {
    const actor = await requireActor(id ? "vendors.update.any" : "vendors.create.any");
    const data = vendorInputSchema.parse(input);
    const repo = new PrismaVendorRepository();
    const vendor = id ? await repo.update(actor, id, data) : await repo.create(actor, data);
    revalidatePath("/vendors");
    return { ok: true, data: vendor, message: id ? "Vendor updated." : "Vendor created." };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteVendorAction(id: string): Promise<MasterDataActionResult> {
  try {
    const actor = await requireActor("vendors.delete.any");
    await new PrismaVendorRepository().softDelete(actor, id);
    revalidatePath("/vendors");
    return { ok: true, message: "Vendor deleted." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveAccountForCustomerAction(customerId: string, input: unknown, accountId?: string): Promise<MasterDataActionResult> {
  try {
    const actor = await requireActor(accountId ? "accounts.update.any" : "accounts.create.any");
    new AuthorizationService().assertCan(actor, "customers.update.any");
    const data = accountInputSchema.parse(input);
    const accounts = new PrismaAccountRepository();
    const account = accountId ? await accounts.update(actor, accountId, data) : await accounts.create(actor, data);
    await new PrismaCustomerRepository().update(actor, customerId, { accountId: account.id });
    revalidatePath("/customers");
    return { ok: true, data: account, message: "Customer account saved." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveAccountForVendorAction(vendorId: string, input: unknown, accountId?: string): Promise<MasterDataActionResult> {
  try {
    const actor = await requireActor(accountId ? "accounts.update.any" : "accounts.create.any");
    new AuthorizationService().assertCan(actor, "vendors.update.any");
    const data = accountInputSchema.parse(input);
    const accounts = new PrismaAccountRepository();
    const account = accountId ? await accounts.update(actor, accountId, data) : await accounts.create(actor, data);
    await new PrismaVendorRepository().update(actor, vendorId, { accountId: account.id });
    revalidatePath("/vendors");
    return { ok: true, data: account, message: "Vendor account saved." };
  } catch (error) {
    return actionError(error);
  }
}

async function requireActor(permission: PermissionCode) {
  const actor = await getCurrentActor();
  if (!actor) {
    throw new Error("Unauthorized.");
  }
  new AuthorizationService().assertCan(actor, permission);
  return actor;
}

function actionError(error: unknown): MasterDataActionResult {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Action failed.",
  };
}
