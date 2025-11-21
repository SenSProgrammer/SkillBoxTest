import { z } from "zod"; export const env = z.object({DATABASE_URL:z.string(),PORT:z.string().transform(Number).default("8080"),CORS_ORIGIN:z.string().optional()}).parse(process.env);
