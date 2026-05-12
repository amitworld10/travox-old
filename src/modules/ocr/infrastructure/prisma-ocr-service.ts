import "server-only";
import { OcrStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type { ActorContext } from "@/shared/application/actor-context";
import { recordAuditEvent } from "@/modules/audit-logs/application/record-audit-event";
import { PrismaFileRepository } from "@/modules/files/infrastructure/prisma-file-repository";
import type { OcrResultDto } from "../application/ocr-dto";
import type { OcrProviderPort } from "../domain/ocr-provider";
import { GeminiOcrProvider } from "./gemini-ocr-provider";

const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]);

export class PrismaOcrService {
  constructor(
    private readonly provider: OcrProviderPort = new GeminiOcrProvider(),
    private readonly files = new PrismaFileRepository(),
  ) {}

  health() {
    return this.provider.health();
  }

  async scanUpload(actor: ActorContext, input: { bytes: Buffer; mimeType: string; fileName: string }): Promise<OcrResultDto> {
    this.assertSupported(input.mimeType);
    const job = await prisma.ocrJob.create({
      data: { orgId: actor.orgId, status: OcrStatus.PENDING, engine: "gemini-2.5-flash" },
    });
    try {
      const booking = await this.provider.extract(input);
      await prisma.ocrJob.update({ where: { id: job.id }, data: { status: OcrStatus.SUCCESS, extractedJson: booking as Prisma.InputJsonValue } });
      await recordAuditEvent({ actor, entity: "ocr", entityId: job.id, action: "CREATE", after: { status: "SUCCESS", fileName: input.fileName } });
      return { jobId: job.id, fileName: input.fileName, booking, message: "OCR extraction completed successfully." };
    } catch (error) {
      await prisma.ocrJob.update({ where: { id: job.id }, data: { status: OcrStatus.FAILED, errorMessage: error instanceof Error ? error.message : "OCR failed." } });
      await recordAuditEvent({ actor, entity: "ocr", entityId: job.id, action: "CREATE", after: { status: "FAILED", fileName: input.fileName, error: error instanceof Error ? error.message : "OCR failed." } });
      throw error;
    }
  }

  async scanFile(actor: ActorContext, fileId: string): Promise<OcrResultDto> {
    const file = await this.files.findById(actor, fileId);
    if (!file) throw new Error("File not found.");
    this.assertSupported(file.mimeType);
    const job = await prisma.ocrJob.create({
      data: { orgId: actor.orgId, fileId, status: OcrStatus.PENDING, engine: "gemini-2.5-flash" },
    });
    try {
      const downloaded = await this.files.download(actor, fileId);
      const booking = await this.provider.extract({ bytes: downloaded.bytes, mimeType: downloaded.mimeType, fileName: downloaded.name });
      await prisma.ocrJob.update({ where: { id: job.id }, data: { status: OcrStatus.SUCCESS, extractedJson: booking as Prisma.InputJsonValue } });
      await recordAuditEvent({ actor, entity: "ocr", entityId: job.id, action: "CREATE", after: { status: "SUCCESS", fileId, fileName: downloaded.name } });
      return { jobId: job.id, fileId, fileName: downloaded.name, booking, message: "OCR extraction completed successfully." };
    } catch (error) {
      await prisma.ocrJob.update({ where: { id: job.id }, data: { status: OcrStatus.FAILED, errorMessage: error instanceof Error ? error.message : "OCR failed." } });
      await recordAuditEvent({ actor, entity: "ocr", entityId: job.id, action: "CREATE", after: { status: "FAILED", fileId, error: error instanceof Error ? error.message : "OCR failed." } });
      throw error;
    }
  }

  private assertSupported(mimeType: string) {
    if (!supportedMimeTypes.has(mimeType)) {
      throw new Error("Unsupported file type for OCR. Supported types: JPEG, PNG, GIF, WebP, PDF.");
    }
  }
}
