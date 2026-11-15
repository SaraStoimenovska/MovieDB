import { describe, expect, it } from "vitest";
import { MediaType } from "@/shared/lib/tmdb/types";
import { makeMedia } from "@/test/fixtures";
import { type LibraryEntry, WatchStatus } from "@/modules/library";
import { computeStats, isEmptyStats, ratingDistribution, topGenres } from "./stats";

const EMPTY_LIBRARY = { entries: {} };

const entry = ({
  id,
  ...overrides
}: Partial<LibraryEntry> & { readonly id: number }): LibraryEntry => ({
  media: makeMedia({ id }),
  isFavorite: false,
  status: null,
  rating: null,
  runtimeMinutes: null,
  favoritedAt: null,
  statusAt: null,
  ratedAt: null,
  updatedAt: 0,
  ...overrides,
});

const library = (entries: ReadonlyArray<LibraryEntry>) => ({
  entries: Object.fromEntries(entries.map((e) => [e.media.key, e])),
});

const genres = { 18: "Drama", 35: "Comedy" };

describe("computeStats", () => {
  const data = library([
    entry({ id: 1, status: WatchStatus.Watched, runtimeMinutes: 120, rating: 8, statusAt: 1 }),
    entry({
      id: 2,
      status: WatchStatus.Watched,
      runtimeMinutes: null,
      rating: 6,
      statusAt: 3,
      isFavorite: true,
    }),
    entry({
      id: 3,
      status: WatchStatus.Watched,
      media: makeMedia({ id: 3, mediaType: MediaType.Tv, genreIds: [35] }),
      statusAt: 2,
    }),
    entry({ id: 4, status: WatchStatus.ToWatch }),
  ]);
  const stats = computeStats(
    { library: data, episodes: { episodes: 5, minutes: 250 }, reviews: 2, notes: 1 },
    genres,
  );

  it("counts watched titles by type and the lists", () => {
    expect(stats).toMatchObject({
      watchedMovies: 2,
      watchedSeries: 1,
      toWatch: 1,
      favorites: 1,
      reviews: 2,
      notes: 1,
    });
  });

  it("adds known movie runtimes and episode minutes, and reports unknown runtimes", () => {
    expect(stats.minutesWatched).toBe(120 + 250);
    expect(stats.moviesWithoutRuntime).toBe(1);
    expect(stats.episodesWatched).toBe(5);
  });

  it("computes the average and distribution of personal ratings", () => {
    expect(stats.averageRating).toBe(7);
    expect(stats.ratedCount).toBe(2);
    expect(stats.ratingDistribution[7]).toBe(1);
    expect(stats.ratingDistribution[5]).toBe(1);
  });

  it("lists recently watched titles newest first", () => {
    expect(stats.recentlyWatched.map((m) => m.id)).toEqual([2, 3, 1]);
  });

  it("is empty for an empty library", () => {
    expect(
      isEmptyStats(
        computeStats(
          { library: EMPTY_LIBRARY, episodes: { episodes: 0, minutes: 0 }, reviews: 0, notes: 0 },
          genres,
        ),
      ),
    ).toBe(true);
    expect(isEmptyStats(stats)).toBe(false);
  });
});

describe("topGenres / ratingDistribution", () => {
  it("ranks genres by count, then name, skipping unknown ids", () => {
    const watched = [
      entry({ id: 1, media: makeMedia({ id: 1, genreIds: [18, 35, 999] }) }),
      entry({ id: 2, media: makeMedia({ id: 2, genreIds: [35] }) }),
    ];
    expect(topGenres(watched, genres)).toEqual([
      { name: "Comedy", count: 2 },
      { name: "Drama", count: 1 },
    ]);
  });

  it("buckets ratings 1–10", () => {
    expect(ratingDistribution([1, 10, 10])).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 2]);
  });
});
