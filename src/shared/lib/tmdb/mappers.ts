import { type z } from "zod";
import { TMDB_MAX_PAGE } from "@/shared/lib/tmdb/constants";
import {
  TmdbMediaType,
  type TmdbMovie,
  type TmdbMultiItem,
  type TmdbTv,
  tmdbMovieSchema,
  tmdbMultiItemSchema,
  tmdbPagedEnvelopeSchema,
  tmdbTvSchema,
} from "@/shared/lib/tmdb/schemas";
import { type MediaSummary, MediaType, type Paged, toMediaKey } from "@/shared/lib/tmdb/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** TMDB uses "" for unknown dates. */
export const normalizeDate = (value: string | null): string | null =>
  value && ISO_DATE.test(value) ? value : null;

export const mapMovie = (movie: TmdbMovie): MediaSummary => ({
  key: toMediaKey(MediaType.Movie, movie.id),
  id: movie.id,
  mediaType: MediaType.Movie,
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
  key: toMediaKey(MediaType.Tv, tv.id),
  id: tv.id,
  mediaType: MediaType.Tv,
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
    case TmdbMediaType.Movie:
      return mapMovie(item);
    case TmdbMediaType.Tv:
      return mapTv(item);
    case TmdbMediaType.Person:
      return null;
  }
};

const isPresent = <T>(value: T | null): value is T => value !== null;

/**
 * Validates the envelope strictly and each result leniently:
 * invalid items are skipped instead of failing the whole page.
 */
const parsePagedResponse = <S extends z.ZodType, T>(
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

/** A bare array of movies (e.g. a collection's parts), parsed leniently like page results. */
export const parseMovieList = (raw: unknown): ReadonlyArray<MediaSummary> =>
  (Array.isArray(raw) ? raw : [])
    .map((item) => tmdbMovieSchema.safeParse(item))
    .map((parsed) => (parsed.success ? mapMovie(parsed.data) : null))
    .filter(isPresent);

/**
 * A `movie/{id}` or `tv/{id}` details response → card summary (`null` if it doesn't parse).
 * Details list `genres: [{ id, name }]` instead of `genre_ids`.
 */
export const parseDetailsSummary = (mediaType: MediaType, raw: unknown): MediaSummary | null => {
  const genres =
    raw && typeof raw === "object" && "genres" in raw && Array.isArray(raw.genres)
      ? raw.genres.flatMap((genre: unknown) =>
          genre && typeof genre === "object" && "id" in genre && typeof genre.id === "number"
            ? [genre.id]
            : [],
        )
      : [];
  const withIds = raw && typeof raw === "object" ? { ...raw, genre_ids: genres } : raw;
  if (mediaType === MediaType.Movie) {
    const parsed = tmdbMovieSchema.safeParse(withIds);
    return parsed.success ? mapMovie(parsed.data) : null;
  }
  const parsed = tmdbTvSchema.safeParse(withIds);
  return parsed.success ? mapTv(parsed.data) : null;
};

export const parseTvPage = (raw: unknown): Paged<MediaSummary> =>
  parsePagedResponse(raw, tmdbTvSchema, mapTv);

export const parseMultiPage = (raw: unknown): Paged<MediaSummary> =>
  parsePagedResponse(raw, tmdbMultiItemSchema, mapMultiItem);

/** Page parser per media type (discover, trending/{type}, recommendations…). */
export const PAGE_PARSERS: Readonly<Record<MediaType, (raw: unknown) => Paged<MediaSummary>>> = {
  [MediaType.Movie]: parseMoviePage,
  [MediaType.Tv]: parseTvPage,
};

/** For infinite queries: next page number, or undefined when exhausted. */
export const getNextPageParam = (page: Paged<unknown>): number | undefined =>
  page.page < Math.min(page.totalPages, TMDB_MAX_PAGE) ? page.page + 1 : undefined;
