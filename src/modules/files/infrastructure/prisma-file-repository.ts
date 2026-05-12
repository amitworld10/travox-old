import "server-only";
import { FileKind, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import { recordAuditEvent } from "@/modules/audit-logs/application/record-audit-event";
import type { CreateFileInput, DownloadedFile, FileAssetDto, FileFilters, FileListDto, UpdateFileInput } from "../application/file-dto";
import type { FileStoragePort } from "../domain/file-storage";
import { createFileStorage } from "./google-drive-storage";

type FileRecord = Prisma.FileAssetGetPayload<Record<string, never>>;

export class PrismaFileRepository {
  constructor(private readonly storage: FileStoragePort = createFileStorage()) {}

  async list(actor: ActorContext, filters: FileFilters = {}): Promise<FileListDto> {
    const where: Prisma.FileAssetWhereInput = {
      orgId: actor.orgId,
      deletedAt: null,
      kind: filters.kind ? toFileKind(filters.kind) : undefined,
      uploadedBy: filters.uploadedBy || undefined,
    };
    const take = Math.min(Math.max(filters.limit ?? 50, 1), 100);
    const skip = Math.max(filters.offset ?? 0, 0);
    const [files, count] = await Promise.all([
      prisma.fileAsset.findMany({ where, orderBy: { uploadedAt: "desc" }, take, skip }),
      prisma.fileAsset.count({ where }),
    ]);
    return { data: files.map(toFileDto), count };
  }

  async findById(actor: ActorContext, id: string): Promise<FileAssetDto | null> {
    const file = await prisma.fileAsset.findFirst({ where: activeFileWhere(actor, id) });
    return file ? toFileDto(file) : null;
  }

  async create(actor: ActorContext, input: CreateFileInput): Promise<FileAssetDto> {
    validateUpload(input);
    const stored = await this.storage.upload({ bytes: input.bytes, fileName: input.name, mimeType: input.mimeType });
    try {
      const file = await prisma.$transaction(async (tx) => {
        const created = await tx.fileAsset.create({
          data: {
            orgId: actor.orgId,
            name: input.name,
            mimeType: input.mimeType,
            size: input.size,
            kind: toFileKind(input.kind),
            storageKey: stored.storageKey,
            provider: stored.provider,
            uploadedBy: actor.userId,
            uploadedAt: new Date(),
          },
        });
        if (input.bookingId && input.kind === "TICKET") {
          const booking = await tx.booking.findFirst({ where: { id: input.bookingId, orgId: actor.orgId, isDeleted: false, deletedAt: null } });
          if (!booking) throw new Error("Booking not found.");
          await tx.booking.update({ where: { id: input.bookingId }, data: { ticketFileId: created.id, updatedBy: actor.userId } });
        }
        return created;
      });
      const dto = toFileDto(file);
      await recordAuditEvent({ actor, entity: "files", entityId: dto.id, action: "CREATE", after: { ...dto, storageKey: "[redacted]" } });
      return dto;
    } catch (error) {
      await this.storage.delete(stored.storageKey).catch(() => undefined);
      throw error;
    }
  }

  async update(actor: ActorContext, id: string, input: UpdateFileInput): Promise<FileAssetDto> {
    const before = toFileDto(await this.requireRaw(actor, id));
    const file = await prisma.fileAsset.update({
      where: { id },
      data: { name: input.name, kind: input.kind ? toFileKind(input.kind) : undefined },
    });
    const dto = toFileDto(file);
    await recordAuditEvent({ actor, entity: "files", entityId: id, action: "UPDATE", before: { ...before, storageKey: "[redacted]" }, after: { ...dto, storageKey: "[redacted]" } });
    return dto;
  }

  async delete(actor: ActorContext, id: string): Promise<void> {
    const file = await this.requireRaw(actor, id);
    await prisma.fileAsset.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.storage.delete(file.storageKey);
    await recordAuditEvent({ actor, entity: "files", entityId: id, action: "DELETE", before: { ...toFileDto(file), storageKey: "[redacted]" } });
  }

  async download(actor: ActorContext, id: string): Promise<DownloadedFile> {
    const file = await this.requireRaw(actor, id);
    const bytes = await this.storage.download(file.storageKey);
    return { bytes, name: file.name, mimeType: file.mimeType, size: file.size };
  }

  private async requireRaw(actor: ActorContext, id: string): Promise<FileRecord> {
    const file = await prisma.fileAsset.findFirst({ where: activeFileWhere(actor, id) });
    if (!file) throw new Error("File not found.");
    return file;
  }
}

function validateUpload(input: CreateFileInput) {
  if (input.size <= 0) throw new Error("Uploaded file is empty.");
  if (input.size > 20 * 1024 * 1024) throw new Error("File exceeds the 20MB upload limit.");
  if (!input.mimeType) throw new Error("File MIME type is required.");
}

function activeFileWhere(actor: ActorContext, id: string): Prisma.FileAssetWhereInput {
  return { id, orgId: actor.orgId, deletedAt: null };
}

function toFileKind(kind: string): FileKind {
  if (kind in FileKind) return kind as FileKind;
  throw new Error("Unsupported file kind.");
}

export function toFileDto(file: FileRecord): FileAssetDto {
  return {
    id: file.id,
    orgId: file.orgId,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    kind: file.kind,
    storageKey: file.storageKey,
    provider: file.provider,
    uploadedBy: file.uploadedBy,
    uploadedAt: file.uploadedAt.toISOString(),
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  };
}
