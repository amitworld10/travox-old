import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_MAINTENANCE_ENABLED: z.coerce.boolean().default(false),
  NEXT_PUBLIC_MAINTENANCE_MESSAGE: z.string().optional(),
  NEXT_PUBLIC_MAINTENANCE_DETAILS: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_MAINTENANCE_ENABLED: process.env.NEXT_PUBLIC_MAINTENANCE_ENABLED,
    NEXT_PUBLIC_MAINTENANCE_MESSAGE: process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE,
    NEXT_PUBLIC_MAINTENANCE_DETAILS: process.env.NEXT_PUBLIC_MAINTENANCE_DETAILS,
  });
}
