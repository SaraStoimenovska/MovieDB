import {
  type LibraryData,
  type LibraryEntry,
  snapshotToSummary,
  WatchStatus,
} from "@/modules/library";
import { RATING_SCALE } from "@/shared/config/rating";
import { type MediaSummary, MediaType } from "@/shared/lib/tmdb/types";

export type StatsInput = {
  readonly library: LibraryData;
  readonly episodes: { readonly episodes: number; readonly minutes: number };
  readonly reviews: number;
  readonly notes: number;
};

export type GenreCount = { readonly name: string; readonly count: number };

export type Stats = {
  readonly favorites: number;
  readonly toWatch: number;
  readonly watchedMovies: number;
  readonly watchedSeries: number;
  readonly episodesWatched: number;
  /** Movies with a known runtime + tracked episodes. */
  readonly minutesWatched: number;
  /** Watched movies whose runtime we don't know (saved from a card, not a details page). */
  readonly moviesWithoutRuntime: number;
  readonly ratedCount: number;
  readonly averageRating: number | null;
  /** Index 0 = rating 1 … index 9 = rating 10. */
  readonly ratingDistribution: ReadonlyArray<number>;
  readonly topGenres: ReadonlyArray<GenreCount>;
  readonly recentlyWatched: ReadonlyArray<MediaSummary>;
  readonly reviews: number;
  readonly notes: number;
};

const TOP_GENRES = 8;
const RECENTLY_WATCHED = 12;

const round1 = (value: number): number => Math.round(value * 10) / 10;

const count = <T>(items: ReadonlyArray<T>, predicate: (item: T) => boolean): number =>
  items.filter(predicate).length;

/** Most common genres among watched titles (unknown genre ids are skipped). */
export const topGenres = (
  watched: ReadonlyArray<LibraryEntry>,
  genreNames: Readonly<Record<number, string>>,
  limit: number = TOP_GENRES,
): ReadonlyArray<GenreCount> => {
  const counts = watched
    .flatMap((entry) => entry.media.genreIds)
    .map((id) => genreNames[id])
    .filter((name): name is string => name !== undefined)
    .reduce<Readonly<Record<string, number>>>(
      (acc, name) => ({ ...acc, [name]: (acc[name] ?? 0) + 1 }),
      {},
    );
  return Object.entries(counts)
    .map(([name, value]) => ({ name, count: value }))
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
};

export const ratingDistribution = (ratings: ReadonlyArray<number>): ReadonlyArray<number> =>
  Array.from({ length: RATING_SCALE.max - RATING_SCALE.min + 1 }, (_, index) =>
    count(ratings, (rating) => rating === RATING_SCALE.min + index),
  );

/** Everything the stats page shows, from the raw stores. Pure. */
export const computeStats = (
  input: StatsInput,
  genreNames: Readonly<Record<number, string>>,
): Stats => {
  const entries = Object.values(input.library.entries);
  const watched = entries.filter((entry) => entry.status === WatchStatus.Watched);
  const watchedMovies = watched.filter((entry) => entry.media.mediaType === MediaType.Movie);
  const ratings = entries
    .map((entry) => entry.rating)
    .filter((rating): rating is number => rating !== null);
  const movieMinutes = watchedMovies.reduce((sum, entry) => sum + (entry.runtimeMinutes ?? 0), 0);

  return {
    favorites: count(entries, (entry) => entry.isFavorite),
    toWatch: count(entries, (entry) => entry.status === WatchStatus.ToWatch),
    watchedMovies: watchedMovies.length,
    watchedSeries: watched.length - watchedMovies.length,
    episodesWatched: input.episodes.episodes,
    minutesWatched: movieMinutes + input.episodes.minutes,
    moviesWithoutRuntime: count(watchedMovies, (entry) => entry.runtimeMinutes === null),
    ratedCount: ratings.length,
    averageRating:
      ratings.length === 0 ? null : round1(ratings.reduce((sum, r) => sum + r, 0) / ratings.length),
    ratingDistribution: ratingDistribution(ratings),
    topGenres: topGenres(watched, genreNames),
    recentlyWatched: watched
      .toSorted((a, b) => (b.statusAt ?? 0) - (a.statusAt ?? 0))
      .slice(0, RECENTLY_WATCHED)
      .map((entry) => snapshotToSummary(entry.media)),
    reviews: input.reviews,
    notes: input.notes,
  };
};

export const isEmptyStats = (stats: Stats): boolean =>
  stats.favorites +
    stats.toWatch +
    stats.watchedMovies +
    stats.watchedSeries +
    stats.episodesWatched +
    stats.reviews +
    stats.notes ===
  0;
