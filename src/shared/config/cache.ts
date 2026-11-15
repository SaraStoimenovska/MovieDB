/**
 * Server cache freshness per kind of TMDB data (Next.js `cacheLife` profiles).
 * "hours": revalidate hourly; "days": daily. Tune freshness here, not at call sites.
 */
export const CACHE_LIFE = {
  trending: "hours",
  discover: "hours",
  proxy: "hours",
  genres: "days",
  details: "days",
} as const;

/** Cache tags, so a group of entries can be invalidated with `revalidateTag`. */
export const CacheTag = {
  Tmdb: "tmdb",
  trending: (scope: string, window: string) => `trending:${scope}:${window}`,
  genres: (mediaType: string) => `genres:${mediaType}`,
  discover: (mediaType: string) => `discover:${mediaType}`,
  media: (mediaType: string, id: number) => `media:${mediaType}:${id}`,
  person: (id: number) => `person:${id}`,
  collection: (id: number) => `collection:${id}`,
  movieList: (list: string) => `movie-list:${list}`,
} as const;
