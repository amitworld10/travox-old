export type StoredFile = {
  storageKey: string;
  provider: string;
};

export type FileStoragePort = {
  upload(input: { bytes: Buffer; fileName: string; mimeType: string }): Promise<StoredFile>;
  download(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
};
