import { z } from "zod";
import { isMediaKey, type MediaKey } from "@/shared/lib/tmdb/types";

/**
 * Raw TMDB response schemas. TMDB is inconsistent (empty strings for unknown dates,
 * nulls for missing images), so schemas are lenient and the mappers normalize.
 */

const nullableString = z
  .string()
  .nullish()
  .transform((v) => v ?? null);

const tmdbMediaBase = z.object({
  id: z.number().int(),
  overview: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  poster_path: nullableString,
  backdrop_path: nullableString,
  vote_average: z
    .number()
    .nullish()
    .transform((v) => v ?? 0),
  vote_count: z
    .number()
    .nullish()
    .transform((v) => v ?? 0),
  genre_ids: z
    .array(z.number())
    .nullish()
    .transform((v) => v ?? []),
});

export const tmdbMovieSchema = tmdbMediaBase.extend({
  title: z.string(),
  release_date: nullableString,
});

export const tmdbTvSchema = tmdbMediaBase.extend({
  name: z.string(),
  first_air_date: nullableString,
});

/** `media_type` values TMDB returns in mixed results (people are not app media). */
export const TmdbMediaType = { Movie: "movie", Tv: "tv", Person: "person" } as const;

/** Items of `/trending/all/*` and `/search/multi`: movies, series and people. */
export const tmdbMultiItemSchema = z.discriminatedUnion("media_type", [
  tmdbMovieSchema.extend({ media_type: z.literal(TmdbMediaType.Movie) }),
  tmdbTvSchema.extend({ media_type: z.literal(TmdbMediaType.Tv) }),
  z.looseObject({ media_type: z.literal(TmdbMediaType.Person), id: z.number() }),
]);

/** Results are parsed item by item (see `parsePagedResponse`), so one bad item never drops a page. */
export const tmdbPagedEnvelopeSchema = z.object({
  page: z.number().int(),
  total_pages: z.number().int(),
  total_results: z.number().int(),
  results: z.array(z.unknown()),
});

export type TmdbMovie = z.infer<typeof tmdbMovieSchema>;
export type TmdbTv = z.infer<typeof tmdbTvSchema>;
export type TmdbMultiItem = z.infer<typeof tmdbMultiItemSchema>;

/** Validates app media keys (`movie:550`) in persisted data. */
export const mediaKeySchema = z.custom<MediaKey>(isMediaKey);
