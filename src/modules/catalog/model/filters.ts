import { QueryParam } from "@/shared/config/routes";
import { type QueryParams } from "@/shared/lib/tmdb/request";
import { MEDIA_TYPE_PLURAL_LABELS, MEDIA_TYPES, MediaType } from "@/shared/lib/tmdb/types";

// ===================== Sort =====================

export const SortKey = { Popular: "popular", TopRated: "top_rated", Newest: "newest" } as const;
export type SortKey = (typeof SortKey)[keyof typeof SortKey];

export const SORT_KEYS: ReadonlyArray<SortKey> = Object.values(SortKey);

export const SORT_LABELS: Readonly<Record<SortKey, string>> = {
  [SortKey.Popular]: "Most popular",
  [SortKey.TopRated]: "Top rated",
  [SortKey.Newest]: "Newest",
};

export const isSortKey = (value: unknown): value is SortKey =>
  typeof value === "string" && (SORT_KEYS as ReadonlyArray<string>).includes(value);

// ===================== Filters =====================

export type CatalogFilters = {
  readonly sort: SortKey;
  readonly genreId: number | null;
  readonly year: number | null;
  /** TMDB keyword (set by clicking a keyword on a details page). */
  readonly keywordId: number | null;
};

export const DEFAULT_FILTERS: CatalogFilters = {
  sort: SortKey.Popular,
  genreId: null,
  year: null,
  keywordId: null,
};

/** Year filter range: from the dawn of cinema to next year (announced titles). */
const MIN_YEAR = 1900;
const YEARS_AHEAD = 1;

export const maxFilterYear = (now: Date = new Date()): number => now.getFullYear() + YEARS_AHEAD;

/** Read-only view over URLSearchParams / Next's ReadonlyURLSearchParams. */
type SearchParamsLike = { readonly get: (name: string) => string | null };

const POSITIVE_INT = /^\d+$/;

const parsePositiveInt = (value: string | null): number | null => {
  if (value === null || !POSITIVE_INT.test(value)) return null;
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
  maxYear: number = maxFilterYear(),
): CatalogFilters => {
  const sort = params.get(QueryParam.Sort);
  return {
    sort: isSortKey(sort) ? sort : DEFAULT_FILTERS.sort,
    genreId: parsePositiveInt(params.get(QueryParam.Genre)),
    year: parseYear(params.get(QueryParam.Year), maxYear),
    keywordId: parsePositiveInt(params.get(QueryParam.Keyword)),
  };
};

/** Filters → URL query (defaults omitted, so the plain `/browse` URL stays clean). */
export const toFilterSearchString = (filters: CatalogFilters): string =>
  new URLSearchParams(
    [
      filters.sort !== DEFAULT_FILTERS.sort ? [QueryParam.Sort, filters.sort] : null,
      filters.genreId !== null ? [QueryParam.Genre, String(filters.genreId)] : null,
      filters.year !== null ? [QueryParam.Year, String(filters.year)] : null,
      filters.keywordId !== null ? [QueryParam.Keyword, String(filters.keywordId)] : null,
    ].filter((entry): entry is [string, string] => entry !== null),
  ).toString();

// ===================== Filters → TMDB discover =====================

const SORT_BY: Readonly<Record<MediaType, Readonly<Record<SortKey, string>>>> = {
  [MediaType.Movie]: {
    [SortKey.Popular]: "popularity.desc",
    [SortKey.TopRated]: "vote_average.desc",
    [SortKey.Newest]: "primary_release_date.desc",
  },
  [MediaType.Tv]: {
    [SortKey.Popular]: "popularity.desc",
    [SortKey.TopRated]: "vote_average.desc",
    [SortKey.Newest]: "first_air_date.desc",
  },
};

const YEAR_PARAM: Readonly<Record<MediaType, string>> = {
  [MediaType.Movie]: "primary_release_year",
  [MediaType.Tv]: "first_air_date_year",
};

/** "Top rated" and "Newest" are flooded by obscure titles with 1–2 votes; require a minimum. */
const MIN_VOTES: Readonly<Record<SortKey, number | null>> = {
  [SortKey.Popular]: null,
  [SortKey.TopRated]: 300,
  [SortKey.Newest]: 20,
};

/** Filters → TMDB `/discover/{type}` query params. */
export const toDiscoverParams = (mediaType: MediaType, filters: CatalogFilters): QueryParams => ({
  sort_by: SORT_BY[mediaType][filters.sort],
  with_genres: filters.genreId,
  with_keywords: filters.keywordId,
  [YEAR_PARAM[mediaType]]: filters.year,
  "vote_count.gte": MIN_VOTES[filters.sort],
  include_adult: false,
});

// ===================== Browse page (single page, Movies / Series tabs) =====================

export const BROWSE_TABS: ReadonlyArray<{ readonly value: MediaType; readonly label: string }> =
  MEDIA_TYPES.map((value) => ({ value, label: MEDIA_TYPE_PLURAL_LABELS[value] }));

/** Movies is the default tab; anything unknown falls back to it. */
export const parseMediaTypeParam = (value: string | null): MediaType =>
  value === MediaType.Tv ? MediaType.Tv : MediaType.Movie;

export type BrowseState = { readonly mediaType: MediaType; readonly filters: CatalogFilters };

export const parseBrowseState = (params: SearchParamsLike, maxYear?: number): BrowseState => ({
  mediaType: parseMediaTypeParam(params.get(QueryParam.Type)),
  filters: parseCatalogFilters(params, maxYear),
});

/** `type` first, defaults omitted: `/browse`, `/browse?type=tv&sort=top_rated`. */
export const toBrowseSearchString = ({ mediaType, filters }: BrowseState): string => {
  const typePart = mediaType === MediaType.Movie ? "" : `${QueryParam.Type}=${mediaType}`;
  return [typePart, toFilterSearchString(filters)].filter(Boolean).join("&");
};

/** Genre ids differ between movies and series, so switching tab drops the genre filter. */
export const switchMediaType = (state: BrowseState, mediaType: MediaType): BrowseState => ({
  mediaType,
  filters: {
    ...state.filters,
    genreId: mediaType === state.mediaType ? state.filters.genreId : null,
    // Keyword ids are shared by movies and series in TMDB, so the keyword filter carries over.
    keywordId: state.filters.keywordId,
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

/** True when any filter differs from the defaults (shows the Reset button). */
export const hasActiveFilters = (filters: CatalogFilters): boolean =>
  toFilterSearchString(filters) !== "";
