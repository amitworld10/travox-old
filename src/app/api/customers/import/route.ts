import type { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/modules/customers/infrastructure/prisma-customer-repository";
import { customerInputSchema } from "@/modules/customers/presentation/schemas/customer-schemas";
import { fail, ok, requireActor } from "@/modules/master-data/presentation/http/master-data-route-helpers";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActor("customers.import.any");
    const contentType = request.headers.get("content-type") ?? "";
    const rows = contentType.includes("multipart/form-data") ? await rowsFromFormData(request) : await request.json();
    const repo = new PrismaCustomerRepository();
    const imported = [];

    for (const row of Array.isArray(rows) ? rows : rows.rows ?? []) {
      imported.push(await repo.create(actor, customerInputSchema.parse(row)));
    }

    return ok({ imported: imported.length, data: imported }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

async function rowsFromFormData(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("CSV file is required.");
  }

  const text = await file.text();
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}
