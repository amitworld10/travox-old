export async function ocrUploadInputFromRequest(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file uploaded.");
  return {
    bytes: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type || "application/octet-stream",
    fileName: file.name,
  };
}
