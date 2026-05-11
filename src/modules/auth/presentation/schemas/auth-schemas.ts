import { z } from "zod";

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  orgId: z.string().optional(),
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
