import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.string().transform(Number).default("8080"),
  CORS_ORIGIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
