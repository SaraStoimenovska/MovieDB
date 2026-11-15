import { type MediaType } from "@/shared/lib/tmdb/types";
import { type QueryParams } from "@/shared/lib/tmdb/request";

export const SORT_KEYS = ["popular", "top_rated", "newest"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABELS: Readonly<Record<SortKey, string>> = {
  popular: "Most popular",
  top_rated: "Top rated",
  newest: "Newest",
};

export type CatalogFilters = {
  readonly sort: SortKey;
  readonly genreId: number | null;
  readonly year: number | null;
};

export const DEFAULT_FILTERS: CatalogFilters = { sort: "popular", genreId: null, year: null };

export const MIN_YEAR = 1900;

/** Read-only view over URLSearchParams / Next's ReadonlyURLSearchParams. */
type SearchParamsLike = { readonly get: (name: string) => string | null };

const isSortKey = (value: unknown): value is SortKey =>
  typeof value === "string" && (SORT_KEYS as ReadonlyArray<string>).includes(value);

const parsePositiveInt = (value: string | null): number | null => {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseYear = (value: string | null, maxYear: number): number | null => {
  const year = parsePositiveInt(value);
  return year !== null && year >= MIN_YEAR && year <= maxYear ? year : null;
};

/** URL → filters. Anything invalid silently falls back to the default, so a bad link never breaks the page. */
export const parseCatalogFilters = (
  params: SearchParamsLike,
  maxYear: number = new Date().getFullYear() + 1,
): CatalogFilters => {
  const sort = params.get("sort");
  return {
    sort: isSortKey(sort) ? sort : DEFAULT_FILTERS.sort,
    genreId: parsePositiveInt(params.get("genre")),
    year: parseYear(params.get("year"), maxYear),
  };
};

/** Filters → URL query (defaults omitted, so the plain `/movies` URL stays clean). */
export const toFilterSearchString = (filters: CatalogFilters): string =>
  new URLSearchParams(
    [
      filters.sort !== DEFAULT_FILTERS.sort ? ["sort", filters.sort] : null,
      filters.genreId !== null ? ["genre", String(filters.genreId)] : null,
      filters.year !== null ? ["year", String(filters.year)] : null,
    ].filter((entry): entry is [string, string] => entry !== null),
  ).toString();

const SORT_BY: Readonly<Record<MediaType, Readonly<Record<SortKey, string>>>> = {
  movie: {
    popular: "popularity.desc",
    top_rated: "vote_average.desc",
    newest: "primary_release_date.desc",
  },
  tv: {
    popular: "popularity.desc",
    top_rated: "vote_average.desc",
    newest: "first_air_date.desc",
  },
};

/** "Top rated" and "Newest" are flooded by obscure titles with 1–2 votes; require a minimum. */
const MIN_VOTES: Readonly<Record<SortKey, number | null>> = {
  popular: null,
  top_rated: 300,
  newest: 20,
};

/** Filters → TMDB `/discover/{type}` query params. */
export const toDiscoverParams = (mediaType: MediaType, filters: CatalogFilters): QueryParams => ({
  sort_by: SORT_BY[mediaType][filters.sort],
  with_genres: filters.genreId,
  [mediaType === "movie" ? "primary_release_year" : "first_air_date_year"]: filters.year,
  "vote_count.gte": MIN_VOTES[filters.sort],
  include_adult: false,
});

// ---------- Browse page (single page, Movies / Series tabs) ----------

export const BROWSE_TABS: ReadonlyArray<{ readonly value: MediaType; readonly label: string }> = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "Series" },
];

export const parseMediaTypeParam = (value: string | null): MediaType =>
  value === "tv" ? "tv" : "movie";

export type BrowseState = { readonly mediaType: MediaType; readonly filters: CatalogFilters };

export const parseBrowseState = (params: SearchParamsLike, maxYear?: number): BrowseState => ({
  mediaType: parseMediaTypeParam(params.get("type")),
  filters: parseCatalogFilters(params, maxYear),
});

/** `type` first, defaults omitted: `/browse`, `/browse?type=tv&sort=top_rated`. */
export const toBrowseSearchString = ({ mediaType, filters }: BrowseState): string => {
  const typePart = mediaType === "movie" ? "" : "type=tv";
  return [typePart, toFilterSearchString(filters)].filter(Boolean).join("&");
};

/** Genre ids differ between movies and series, so switching tab keeps the sort/year only. */
export const switchMediaType = (state: BrowseState, mediaType: MediaType): BrowseState => ({
  mediaType,
  filters: {
    ...state.filters,
    genreId: mediaType === state.mediaType ? state.filters.genreId : null,
  },
});

/** Next's `searchParams` prop (record) → the `get()` interface the parsers use. */
export const toSearchParamsLike = (
  record: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>,
): SearchParamsLike => ({
  get: (name) => {
    const value = record[name];
    return typeof value === "string" ? value : (value?.[0] ?? null);
  },
});

export const updateFilters = (
  filters: CatalogFilters,
  patch: Partial<CatalogFilters>,
): CatalogFilters => ({ ...filters, ...patch });

export const yearOptions = (maxYear: number, minYear: number = MIN_YEAR): ReadonlyArray<number> =>
  Array.from({ length: Math.max(0, maxYear - minYear + 1) }, (_, index) => maxYear - index);
