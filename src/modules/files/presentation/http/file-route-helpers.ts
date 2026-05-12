import type { NextRequest } from "next/server";
import { fileFilterSchema, parseFileKind } from "../schemas/file-schemas";
import type { CreateFileInput } from "../../application/file-dto";

export function fileFiltersFromRequest(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return fileFilterSchema.parse({
    kind: params.get("kind") || undefined,
    uploadedBy: params.get("uploadedBy") || undefined,
    limit: params.get("limit") || undefined,
    offset: params.get("offset") || undefined,
  });
}

export async function createFileInputFromRequest(request: Request): Promise<CreateFileInput> {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file uploaded.");
  const bytes = Buffer.from(await file.arrayBuffer());
  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    kind: parseFileKind(formData.get("kind")),
    bookingId: textOrUndefined(formData.get("bookingId")),
    bytes,
  };
}

export function downloadHeaders(name: string, mimeType: string, size: number) {
  return {
    "Content-Type": mimeType,
    "Content-Length": String(size),
    "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
  };
}

function textOrUndefined(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
}
