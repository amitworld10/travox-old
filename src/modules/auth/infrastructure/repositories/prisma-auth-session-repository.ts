import "server-only";
import { prisma } from "@/shared/infrastructure/prisma/prisma-client";
import type {
  AuthSessionRecord,
  AuthSessionRepository,
} from "../../application/ports/auth-session-repository";

export class PrismaAuthSessionRepository implements AuthSessionRepository {
  async create(record: Omit<AuthSessionRecord, "id">): Promise<AuthSessionRecord> {
    const session = await prisma.authSession.create({
      data: {
        userId: record.userId,
        refreshTokenHash: record.refreshTokenHash,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent,
      },
    });

    return toAuthSessionRecord(session);
  }

  async findByRefreshTokenHash(hash: string): Promise<AuthSessionRecord | null> {
    const session = await prisma.authSession.findUnique({
      where: { refreshTokenHash: hash },
    });

    return session ? toAuthSessionRecord(session) : null;
  }

  async revokeByRefreshTokenHash(hash: string): Promise<void> {
    await prisma.authSession.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

type PrismaAuthSession = Awaited<ReturnType<typeof prisma.authSession.create>>;

function toAuthSessionRecord(session: PrismaAuthSession): AuthSessionRecord {
  return {
    id: session.id,
    userId: session.userId,
    refreshTokenHash: session.refreshTokenHash,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt ?? undefined,
    ipAddress: session.ipAddress ?? undefined,
    userAgent: session.userAgent ?? undefined,
  };
}
