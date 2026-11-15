import { describe, expect, it } from "vitest";
import { MediaType } from "@/shared/lib/tmdb/types";
import { deepFreeze, makeMedia } from "@/test/fixtures";
import {
  addAllToWatchList,
  EMPTY_LIBRARY,
  LIBRARY_VERSION,
  libraryDataSchema,
  migrateLibrary,
  removeFromLibrary,
  selectAddable,
  selectByStatus,
  selectCounts,
  selectEntry,
  selectFavorites,
  selectLatestFavorite,
  setRating,
  setWatchStatus,
  snapshotToSummary,
  toggleFavorite,
  toMediaSnapshot,
  WatchStatus,
} from "./library";

const movie = makeMedia();
const series = makeMedia({ id: 1399, mediaType: MediaType.Tv, title: "Game of Thrones" });
const empty = deepFreeze(EMPTY_LIBRARY);

describe("toggleFavorite", () => {
  it("adds a favorite with a timestamp and a trimmed snapshot", () => {
    const data = toggleFavorite(empty, movie, 100);
    expect(selectEntry(data, movie.key)).toMatchObject({
      isFavorite: true,
      favoritedAt: 100,
      status: null,
    });
  });

  it("removes the entry entirely when nothing is left", () => {
    const added = deepFreeze(toggleFavorite(empty, movie, 100));
    expect(toggleFavorite(added, movie, 200)).toEqual(EMPTY_LIBRARY);
  });

  it("does not mutate the input", () => {
    expect(() => toggleFavorite(empty, movie, 1)).not.toThrow();
    expect(empty).toEqual(EMPTY_LIBRARY);
  });

  it("keeps a known runtime and refreshes the snapshot", () => {
    const first = deepFreeze(toggleFavorite(empty, movie, 1, { runtimeMinutes: 139 }));
    const renamed = { ...movie, title: "Fight Club (Remastered)" };
    const next = setWatchStatus(first, renamed, WatchStatus.ToWatch, 2);
    expect(selectEntry(next, movie.key)).toMatchObject({
      runtimeMinutes: 139,
      media: { title: "Fight Club (Remastered)" },
    });
  });
});

describe("setWatchStatus", () => {
  it("sets, switches and toggles off the status", () => {
    const toWatch = deepFreeze(setWatchStatus(empty, movie, WatchStatus.ToWatch, 1));
    expect(selectEntry(toWatch, movie.key)?.status).toBe(WatchStatus.ToWatch);

    const watched = deepFreeze(setWatchStatus(toWatch, movie, WatchStatus.Watched, 2));
    expect(selectEntry(watched, movie.key)).toMatchObject({
      status: WatchStatus.Watched,
      statusAt: 2,
    });

    expect(setWatchStatus(watched, movie, WatchStatus.Watched, 3)).toEqual(EMPTY_LIBRARY);
  });

  it("keeps the favorite when the status is cleared", () => {
    const data = deepFreeze(
      setWatchStatus(toggleFavorite(empty, movie, 1), movie, WatchStatus.ToWatch, 2),
    );
    expect(selectEntry(setWatchStatus(data, movie, null, 3), movie.key)?.isFavorite).toBe(true);
  });
});

describe("setRating", () => {
  it("rates a title and marks it as watched", () => {
    const data = setRating(empty, movie, 9, 5);
    expect(selectEntry(data, movie.key)).toMatchObject({
      rating: 9,
      ratedAt: 5,
      status: WatchStatus.Watched,
      statusAt: 5,
    });
  });

  it("keeps the original watched date when re-rating", () => {
    const watched = deepFreeze(setWatchStatus(empty, movie, WatchStatus.Watched, 1));
    expect(selectEntry(setRating(watched, movie, 7, 9), movie.key)?.statusAt).toBe(1);
  });

  it("clears the rating but keeps the status", () => {
    const rated = deepFreeze(setRating(empty, movie, 8, 1));
    expect(selectEntry(setRating(rated, movie, null, 2), movie.key)).toMatchObject({
      rating: null,
      status: WatchStatus.Watched,
    });
  });

  it.each([0, 11, 7.5])("ignores invalid rating %s", (rating) => {
    expect(setRating(empty, movie, rating, 1)).toBe(empty);
  });
});

describe("selectors", () => {
  const data = deepFreeze(
    [
      (d: typeof empty) => toggleFavorite(d, movie, 10),
      (d: typeof empty) => toggleFavorite(d, series, 20),
      (d: typeof empty) => setWatchStatus(d, series, WatchStatus.Watched, 30),
      (d: typeof empty) => setWatchStatus(d, makeMedia({ id: 3 }), WatchStatus.ToWatch, 40),
    ].reduce((acc, step) => step(acc), empty),
  );

  it("lists favorites newest first", () => {
    expect(selectFavorites(data).map((e) => e.media.id)).toEqual([1399, 550]);
    expect(selectLatestFavorite(data)?.media.id).toBe(1399);
    expect(selectLatestFavorite(empty)).toBeNull();
  });

  it("filters by status", () => {
    expect(selectByStatus(data, WatchStatus.Watched).map((e) => e.media.id)).toEqual([1399]);
  });

  it("counts everything", () => {
    expect(selectCounts(data)).toEqual({ favorites: 2, to_watch: 1, watched: 1 });
  });

  it("removes an entry", () => {
    expect(selectEntry(removeFromLibrary(data, movie.key), movie.key)).toBeNull();
  });
});

describe("persistence", () => {
  it("accepts what the reducers produce", () => {
    expect(libraryDataSchema.safeParse(setRating(empty, movie, 8, 1)).success).toBe(true);
  });

  it("rejects malformed data", () => {
    expect(libraryDataSchema.safeParse({ entries: { "movie:1": { nope: true } } }).success).toBe(
      false,
    );
    expect(libraryDataSchema.safeParse({ entries: { "bad-key": {} } }).success).toBe(false);
  });

  it("migrates v1 entries (no rating/runtime) to the current version", () => {
    const v1Entry = {
      media: toMediaSnapshot(movie),
      isFavorite: true,
      status: WatchStatus.Watched,
      favoritedAt: 1,
      statusAt: 2,
      updatedAt: 3,
    };
    const migrated = migrateLibrary({ entries: { [movie.key]: v1Entry } }, 1);
    expect(migrated.entries[movie.key]).toEqual({
      ...v1Entry,
      rating: null,
      runtimeMinutes: null,
      ratedAt: null,
    });
    expect(libraryDataSchema.safeParse(migrated).success).toBe(true);
  });

  it("returns an empty library for unrecognizable old data", () => {
    expect(migrateLibrary("garbage", 1)).toEqual(EMPTY_LIBRARY);
  });

  it("passes current-version data through", () => {
    const data = toggleFavorite(empty, movie, 1);
    expect(migrateLibrary(data, LIBRARY_VERSION)).toBe(data);
  });

  it("stores only card fields in snapshots (no overview / backdrop)", () => {
    const snapshot = toMediaSnapshot({
      ...movie,
      overview: "x".repeat(2000),
      backdropPath: "/b.jpg",
    });
    expect(snapshot).not.toHaveProperty("overview");
    expect(snapshot).not.toHaveProperty("backdropPath");
  });

  it("drops the old v2 snapshot fields when v2 data is validated", () => {
    const v3 = toggleFavorite(empty, movie, 1);
    const entry = v3.entries[movie.key]!;
    const v2 = {
      entries: {
        [movie.key]: {
          ...entry,
          media: { ...entry.media, overview: "long", backdropPath: "/b.jpg" },
        },
      },
    };
    const parsed = libraryDataSchema.parse(migrateLibrary(v2, 2));
    expect(parsed).toEqual(v3);
  });

  it("turns a snapshot back into a card summary", () => {
    expect(snapshotToSummary(toMediaSnapshot(movie))).toEqual({
      ...movie,
      overview: "",
      backdropPath: null,
    });
  });
});

describe("addAllToWatchList / selectAddable", () => {
  const a = makeMedia({ id: 1 });
  const b = makeMedia({ id: 2 });
  const c = makeMedia({ id: 3, mediaType: MediaType.Tv });

  it("adds titles without a status to Want to watch, keeping existing statuses", () => {
    const start = deepFreeze(setWatchStatus(EMPTY_LIBRARY, b, WatchStatus.Watched, 1));
    expect(selectAddable(start, [a, b, c, a]).map((item) => item.key)).toEqual([a.key, c.key]);

    const next = addAllToWatchList(start, [a, b, c], 5);
    expect(
      selectByStatus(next, WatchStatus.ToWatch)
        .map((entry) => entry.media.key)
        .toSorted(),
    ).toEqual([a.key, c.key].toSorted());
    expect(selectEntry(next, b.key)?.status).toBe(WatchStatus.Watched);
  });

  it("returns the same object when there is nothing to add", () => {
    const start = deepFreeze(setWatchStatus(EMPTY_LIBRARY, a, WatchStatus.ToWatch, 1));
    expect(addAllToWatchList(start, [a], 2)).toBe(start);
  });
});
