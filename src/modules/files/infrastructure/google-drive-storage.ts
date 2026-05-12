import "server-only";
import type { FileStoragePort, StoredFile } from "../domain/file-storage";
import { LocalFileStorage } from "./local-file-storage";

export class GoogleDriveStorage implements FileStoragePort {
  private readonly fallback = new LocalFileStorage();
  private readonly allowLocalFallback = (process.env.FILE_STORAGE_ALLOW_LOCAL_FALLBACK ?? "true").toLowerCase() !== "false";

  async upload(input: { bytes: Buffer; fileName: string; mimeType: string }): Promise<StoredFile> {
    if (this.allowLocalFallback) {
      const stored = await this.fallback.upload(input);
      return { ...stored, provider: "local-fallback" };
    }
    throw new Error("Google Drive storage adapter requires googleapis wiring in the root Next app.");
  }

  async download(storageKey: string): Promise<Buffer> {
    if (storageKey.startsWith("local:")) return this.fallback.download(storageKey);
    throw new Error("Google Drive download is not configured in the root Next app.");
  }

  async delete(storageKey: string): Promise<void> {
    if (storageKey.startsWith("local:")) return this.fallback.delete(storageKey);
    throw new Error("Google Drive delete is not configured in the root Next app.");
  }
}

export function createFileStorage(): FileStoragePort {
  const provider = (process.env.FILE_STORAGE_PROVIDER || "local").toLowerCase();
  return provider === "google-drive" || provider === "gdrive" ? new GoogleDriveStorage() : new LocalFileStorage();
}
