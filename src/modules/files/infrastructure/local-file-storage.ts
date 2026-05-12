import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStoragePort, StoredFile } from "../domain/file-storage";

const LOCAL_PREFIX = "local:";

export class LocalFileStorage implements FileStoragePort {
  private readonly root = process.env.LOCAL_FILE_STORAGE_PATH || path.join(process.cwd(), "tmp", "file-storage");

  async upload(input: { bytes: Buffer; fileName: string; mimeType: string }): Promise<StoredFile> {
    await mkdir(this.root, { recursive: true });
    const id = randomUUID();
    const storageKey = `${LOCAL_PREFIX}${id}`;
    await Promise.all([
      writeFile(this.dataPath(id), input.bytes),
      writeFile(
        this.metaPath(id),
        JSON.stringify({ name: input.fileName, mimeType: input.mimeType, size: input.bytes.byteLength, createdAt: new Date().toISOString() }, null, 2),
        "utf-8",
      ),
    ]);
    return { storageKey, provider: "local" };
  }

  async download(storageKey: string): Promise<Buffer> {
    return readFile(this.dataPath(this.localId(storageKey)));
  }

  async delete(storageKey: string): Promise<void> {
    const id = this.localId(storageKey);
    await Promise.all([rm(this.dataPath(id), { force: true }), rm(this.metaPath(id), { force: true })]);
  }

  private localId(storageKey: string) {
    if (!storageKey.startsWith(LOCAL_PREFIX)) {
      throw new Error("Unsupported local storage key.");
    }
    return storageKey.slice(LOCAL_PREFIX.length);
  }

  private dataPath(id: string) {
    return path.join(this.root, `${id}.bin`);
  }

  private metaPath(id: string) {
    return path.join(this.root, `${id}.json`);
  }
}
