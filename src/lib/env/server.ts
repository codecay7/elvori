import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_ENCRYPTION_KEY: z.string().min(32),
  COMPILER_SERVICE_URL: z.string().url().optional(),
  COMPILER_SERVICE_TOKEN: z.string().min(1).optional(),
});

export const serverEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
  COMPILER_SERVICE_URL: process.env.COMPILER_SERVICE_URL,
  COMPILER_SERVICE_TOKEN: process.env.COMPILER_SERVICE_TOKEN,
});
