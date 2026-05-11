import "server-only";

export type RepositoryProvider = "prisma" | "mongo";

export function getRepositoryProvider(): RepositoryProvider {
  return "prisma";
}
