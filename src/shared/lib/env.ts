import "server-only";
import { z } from "zod";

/**
 * Server-only environment, validated once at startup.
 * Never import this from a Client Component — the TMDB key must stay on the server.
 */
const serverEnvSchema = z.object({
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is missing. Add it to .env.local"),
  TMDB_API_BASE_URL: z.url().default("https://api.themoviedb.org/3"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const parseServerEnv = (source: Readonly<Record<string, string | undefined>>): ServerEnv =>
  serverEnvSchema.parse(source);

export const serverEnv: ServerEnv = parseServerEnv(process.env);
