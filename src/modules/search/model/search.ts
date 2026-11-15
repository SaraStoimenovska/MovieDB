export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;

/** Trims, collapses whitespace and caps length: what we put in the URL and send to TMDB. */
export const normalizeQuery = (raw: string | null | undefined): string =>
  (raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);

export const isSearchable = (query: string): boolean => query.length >= MIN_QUERY_LENGTH;

export const searchKeys = {
  all: ["search"] as const,
  multi: (query: string) => [...searchKeys.all, "multi", query] as const,
  suggestions: (query: string) => [...searchKeys.all, "suggestions", query] as const,
};

export const SUGGESTION_LIMIT = 6;
