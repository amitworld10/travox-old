export type AuthSessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type AuthSessionRepository = {
  create(record: Omit<AuthSessionRecord, "id">): Promise<AuthSessionRecord>;
  findByRefreshTokenHash(hash: string): Promise<AuthSessionRecord | null>;
  revokeByRefreshTokenHash(hash: string): Promise<void>;
};
