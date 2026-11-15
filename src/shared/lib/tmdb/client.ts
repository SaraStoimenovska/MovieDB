import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { TMDB_LANGUAGE } from "@/shared/config/app";
import { CACHE_LIFE, CacheTag } from "@/shared/config/cache";
import { serverEnv } from "@/shared/lib/env";
import { buildTmdbUrl, type QueryParams } from "@/shared/lib/tmdb/request";

export type TmdbRequestError = Error & { readonly status: number; readonly path: string };

const TMDB_ERROR_NAME = "TmdbRequestError";

const createTmdbError = (status: number, path: string): TmdbRequestError =>
  Object.assign(new Error(`TMDB request failed (${status}) for "${path}"`), {
    name: TMDB_ERROR_NAME,
    status,
    path,
  });

export const isTmdbRequestError = (error: unknown): error is TmdbRequestError =>
  error instanceof Error && error.name === TMDB_ERROR_NAME;

/**
 * Server-side TMDB GET. Returns raw JSON; callers parse it with the zod mappers.
 * Caching is the caller's job (`"use cache"` in module api functions), so this stays a plain fetch.
 */
export const tmdbGet = async (path: string, params: QueryParams = {}): Promise<unknown> => {
  const url = buildTmdbUrl(
    serverEnv.TMDB_API_BASE_URL,
    path,
    { language: TMDB_LANGUAGE, ...params },
    serverEnv.TMDB_API_KEY,
  );

  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw createTmdbError(response.status, path);
  return response.json();
};

/**
 * Same as `tmdbGet`, through the shared server cache (keyed by path + params). Used by the
 * `/api/tmdb/*` proxy, so repeated client requests (page 2 of "popular", common searches)
 * are answered from memory instead of a TMDB round trip. Failed requests are never cached.
 */
export async function tmdbGetCached(path: string, params: QueryParams = {}): Promise<unknown> {
  "use cache";
  cacheLife(CACHE_LIFE.proxy);
  cacheTag(CacheTag.Tmdb);
  return tmdbGet(path, params);
}
