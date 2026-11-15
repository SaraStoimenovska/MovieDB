import { z } from "zod";
import { parseMovieList } from "@/shared/lib/tmdb/mappers";
import { type MediaKey, type MediaSummary } from "@/shared/lib/tmdb/types";

/** A movie franchise (TMDB "collection"), its films in release order. */
export type Collection = {
  readonly id: number;
  readonly name: string;
  readonly overview: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  readonly parts: ReadonlyArray<MediaSummary>;
};

const emptyToNull = z
  .string()
  .nullish()
  .transform((value) => (value ? value : null));

const collectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  overview: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  poster_path: emptyToNull,
  backdrop_path: emptyToNull,
  parts: z.unknown(),
});

/** Undated parts (announced, no release date yet) come after everything that has one. */
const UNDATED = "9999-12-31";

/** Pure: oldest first, so the list reads like a watch order. */
export const sortParts = (parts: ReadonlyArray<MediaSummary>): ReadonlyArray<MediaSummary> =>
  parts.toSorted((a, b) => (a.releaseDate ?? UNDATED).localeCompare(b.releaseDate ?? UNDATED));

/** TMDB `collection/{id}` → domain. The envelope is strict; parts are parsed leniently. */
export const parseCollection = (raw: unknown): Collection => {
  const collection = collectionSchema.parse(raw);
  return {
    id: collection.id,
    name: collection.name,
    overview: collection.overview,
    posterPath: collection.poster_path,
    backdropPath: collection.backdrop_path,
    parts: sortParts(parseMovieList(collection.parts)),
  };
};

export type CollectionProgress = {
  readonly watched: number;
  readonly total: number;
  /** 0–100, rounded. */
  readonly percent: number;
};

/**
 * Pure: how much of the franchise you've seen. Unreleased parts don't count against you
 * (you can't have watched them yet), unless you somehow marked one as watched.
 */
export const collectionProgress = (
  parts: ReadonlyArray<MediaSummary>,
  isWatched: (key: MediaKey) => boolean,
  today: string,
): CollectionProgress => {
  const counted = parts.filter(
    (part) => isWatched(part.key) || (part.releaseDate !== null && part.releaseDate <= today),
  );
  const watched = counted.filter((part) => isWatched(part.key)).length;
  const total = counted.length;
  return { watched, total, percent: total === 0 ? 0 : Math.round((watched / total) * 100) };
};
