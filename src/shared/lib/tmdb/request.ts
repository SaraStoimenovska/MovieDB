/**
 * Pure helpers for building and guarding TMDB requests.
 * Shared by the server client and the `/api/tmdb/*` proxy route.
 */
import { MAX_PROXY_PARAM_LENGTH } from "@/shared/lib/tmdb/constants";

type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

/** Endpoints the browser may reach through the proxy. Everything else is rejected. */
const ALLOWED_PATHS: ReadonlyArray<RegExp> = [
  /^trending\/(all|movie|tv)\/(day|week)$/,
  /^discover\/(movie|tv)$/,
  /^search\/(multi|movie|tv)$/,
  /^genre\/(movie|tv)\/list$/,
  /^(movie|tv)\/\d+$/,
  /^(movie|tv)\/\d+\/(credits|videos|recommendations|similar)$/,
  /^(movie|tv)\/\d+\/watch\/providers$/,
  /^tv\/\d+\/season\/\d+$/,
];

/** Query parameters the proxy forwards. `api_key` is deliberately absent: the server adds it. */
const ALLOWED_QUERY_KEYS: ReadonlySet<string> = new Set([
  "page",
  "language",
  "query",
  "sort_by",
  "with_genres",
  "with_keywords",
  "primary_release_year",
  "first_air_date_year",
  "vote_count.gte",
  "include_adult",
  "append_to_response",
]);

export const normalizePath = (path: string): string => path.replace(/^\/+|\/+$/g, "");

export const isAllowedTmdbPath = (path: string): boolean => {
  const normalized = normalizePath(path);
  return !normalized.includes("..") && ALLOWED_PATHS.some((pattern) => pattern.test(normalized));
};

export const pickAllowedQuery = (params: URLSearchParams): QueryParams =>
  Object.fromEntries(
    [...params.entries()].filter(
      ([key, value]) => ALLOWED_QUERY_KEYS.has(key) && value.length <= MAX_PROXY_PARAM_LENGTH,
    ),
  );

/** Drops empty values so `?genre=` doesn't reach TMDB as an empty filter. */
export const toSearchParams = (params: QueryParams): URLSearchParams =>
  new URLSearchParams(
    Object.entries(params)
      .filter(
        (entry): entry is [string, string | number | boolean] =>
          entry[1] !== null && entry[1] !== undefined && entry[1] !== "",
      )
      .map(([key, value]) => [key, String(value)]),
  );

export const buildTmdbUrl = (
  baseUrl: string,
  path: string,
  params: QueryParams,
  apiKey: string,
): string => {
  const query = toSearchParams({ ...params, api_key: apiKey }).toString();
  return `${baseUrl.replace(/\/+$/, "")}/${normalizePath(path)}?${query}`;
};
