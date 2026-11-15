import { TMDB_LANGUAGE } from "@/shared/config/app";
import { normalizePath, type QueryParams, toSearchParams } from "@/shared/lib/tmdb/request";

/**
 * Client-side TMDB GET through our `/api/tmdb/*` proxy (the API key never reaches the browser).
 * Returns raw JSON; callers parse it with the zod mappers.
 */
export const tmdbProxyGet = async (
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<unknown> => {
  const query = toSearchParams({ language: TMDB_LANGUAGE, ...params }).toString();
  const response = await fetch(`/api/tmdb/${normalizePath(path)}?${query}`, { signal });
  if (!response.ok) throw new Error(`TMDB proxy request failed (${response.status})`);
  return response.json();
};
