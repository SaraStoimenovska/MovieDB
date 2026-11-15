import { type z } from "zod";
import {
  type TmdbMovie,
  type TmdbMultiItem,
  type TmdbTv,
  tmdbMovieSchema,
  tmdbMultiItemSchema,
  tmdbPagedEnvelopeSchema,
  tmdbTvSchema,
} from "@/shared/lib/tmdb/schemas";
import { type MediaSummary, type Paged, toMediaKey } from "@/shared/lib/tmdb/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** TMDB uses "" for unknown dates. */
export const normalizeDate = (value: string | null): string | null =>
  value && ISO_DATE.test(value) ? value : null;

export const mapMovie = (movie: TmdbMovie): MediaSummary => ({
  key: toMediaKey("movie", movie.id),
  id: movie.id,
  mediaType: "movie",
  title: movie.title,
  overview: movie.overview,
  posterPath: movie.poster_path,
  backdropPath: movie.backdrop_path,
  releaseDate: normalizeDate(movie.release_date),
  voteAverage: movie.vote_average,
  voteCount: movie.vote_count,
  genreIds: movie.genre_ids,
});

export const mapTv = (tv: TmdbTv): MediaSummary => ({
  key: toMediaKey("tv", tv.id),
  id: tv.id,
  mediaType: "tv",
  title: tv.name,
  overview: tv.overview,
  posterPath: tv.poster_path,
  backdropPath: tv.backdrop_path,
  releaseDate: normalizeDate(tv.first_air_date),
  voteAverage: tv.vote_average,
  voteCount: tv.vote_count,
  genreIds: tv.genre_ids,
});

/** People are not media: they map to `null` and are filtered out by the caller. */
export const mapMultiItem = (item: TmdbMultiItem): MediaSummary | null => {
  switch (item.media_type) {
    case "movie":
      return mapMovie(item);
    case "tv":
      return mapTv(item);
    case "person":
      return null;
  }
};

const isPresent = <T>(value: T | null): value is T => value !== null;

/**
 * Validates the envelope strictly and each result leniently:
 * invalid items are skipped instead of failing the whole page.
 */
export const parsePagedResponse = <S extends z.ZodType, T>(
  raw: unknown,
  itemSchema: S,
  mapItem: (item: z.infer<S>) => T | null,
): Paged<T> => {
  const envelope = tmdbPagedEnvelopeSchema.parse(raw);
  const results = envelope.results
    .map((item) => itemSchema.safeParse(item))
    .map((parsed) => (parsed.success ? mapItem(parsed.data) : null))
    .filter(isPresent);

  return {
    page: envelope.page,
    totalPages: envelope.total_pages,
    totalResults: envelope.total_results,
    results,
  };
};

export const parseMoviePage = (raw: unknown): Paged<MediaSummary> =>
  parsePagedResponse(raw, tmdbMovieSchema, mapMovie);

export const parseTvPage = (raw: unknown): Paged<MediaSummary> =>
  parsePagedResponse(raw, tmdbTvSchema, mapTv);

export const parseMultiPage = (raw: unknown): Paged<MediaSummary> =>
  parsePagedResponse(raw, tmdbMultiItemSchema, mapMultiItem);

/** For infinite queries: next page number, or undefined when exhausted. TMDB caps paging at 500. */
export const getNextPageParam = (page: Paged<unknown>): number | undefined =>
  page.page < Math.min(page.totalPages, 500) ? page.page + 1 : undefined;
