/** TMDB API facts the app relies on. */

/** TMDB pages are 1-based. */
export const FIRST_PAGE = 1;

/** TMDB rejects `page` above 500 for discover/search. */
export const TMDB_MAX_PAGE = 500;

/** TMDB ratings are on a 0–10 scale. */
export const TMDB_RATING_MAX = 10;

/** Longest query-string value the proxy forwards (guards against abuse). */
export const MAX_PROXY_PARAM_LENGTH = 200;

/** Poster aspect ratio is 2:3; OpenGraph poster size used for link previews. */
export const OG_POSTER_SIZE = { width: 500, height: 750 } as const;

/** TMDB credits/providers without an explicit order sort after everything else. */
export const UNRANKED = Number.MAX_SAFE_INTEGER;
