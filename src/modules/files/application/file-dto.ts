export const fileKinds = ["TICKET", "INVOICE", "VOUCHER", "PASSPORT", "VISA", "OTHER"] as const;
export type FileKindLabel = (typeof fileKinds)[number];

export type FileAssetDto = {
  id: string;
  orgId: string;
  name: string;
  mimeType: string;
  size: number;
  kind: FileKindLabel;
  storageKey: string;
  provider: string;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type FileListDto = {
  data: FileAssetDto[];
  count: number;
};

export type FileFilters = {
  kind?: FileKindLabel;
  uploadedBy?: string;
  limit?: number;
  offset?: number;
};

export type CreateFileInput = {
  name: string;
  mimeType: string;
  size: number;
  kind: FileKindLabel;
  bytes: Buffer;
  bookingId?: string;
};

export type UpdateFileInput = {
  name?: string;
  kind?: FileKindLabel;
};

export type DownloadedFile = {
  bytes: Buffer;
  name: string;
  mimeType: string;
  size: number;
};
