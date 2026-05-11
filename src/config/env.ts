import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  AUTH_ACCESS_TOKEN_PRIVATE_KEY: z.string().optional(),
  AUTH_ACCESS_TOKEN_PUBLIC_KEY: z.string().optional(),
  AUTH_REFRESH_TOKEN_SECRET: z.string().optional(),
  AUTH_ISSUER: z.string().default("travox"),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
  AUTH_ACCESS_COOKIE_NAME: z.string().default("travox-at"),
  AUTH_REFRESH_COOKIE_NAME: z.string().default("refreshToken"),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_ALLOWED_DOMAINS: z.string().optional(),
  FILE_STORAGE_PROVIDER: z.enum(["local", "google"]).default("local"),
  FILE_STORAGE_ALLOW_LOCAL_FALLBACK: z.coerce.boolean().default(true),
  LOCAL_FILE_STORAGE_PATH: z.string().default("tmp/file-storage"),
  GOOGLE_DRIVE_CLIENT_ID: z.string().optional(),
  GOOGLE_DRIVE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_DRIVE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_DRIVE_SHARED_FOLDER_ID: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}
