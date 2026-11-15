import { TMDB_LANGUAGE } from "@/shared/config/app";
import { normalizePath, type QueryParams, toSearchParams } from "@/shared/lib/tmdb/request";

/** Base path of the app's TMDB proxy route (`src/app/api/tmdb/[...path]/route.ts`). */
const TMDB_PROXY_BASE = "/api/tmdb";

/** Absolute in the browser (and jsdom tests, so MSW can intercept); relative otherwise. */
const tmdbProxyUrl = (path: string, params: QueryParams = {}): string => {
  const query = toSearchParams({ language: TMDB_LANGUAGE, ...params }).toString();
  const relative = `${TMDB_PROXY_BASE}/${normalizePath(path)}?${query}`;
  return typeof window === "undefined" ? relative : new URL(relative, window.location.origin).href;
};

/**
 * Client-side TMDB GET through our proxy (the API key never reaches the browser).
 * Returns raw JSON; callers parse it with the zod mappers.
 */
export const tmdbProxyGet = async (
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<unknown> => {
  const response = await fetch(tmdbProxyUrl(path, params), { signal });
  if (!response.ok) throw new Error(`TMDB proxy request failed (${response.status})`);
  return response.json();
};
