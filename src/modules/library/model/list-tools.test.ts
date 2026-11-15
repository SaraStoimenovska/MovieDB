import { describe, expect, it } from "vitest";
import { MediaType } from "@/shared/lib/tmdb/types";
import { deepFreeze, makeMedia } from "@/test/fixtures";
import {
  EMPTY_LIBRARY,
  type LibraryEntry,
  setRating,
  setWatchStatus,
  WatchStatus,
} from "./library";
import {
  ALL_TYPES,
  applyListQuery,
  DEFAULT_LIST_QUERY,
  genreOptions,
  isDefaultQuery,
  isLibrarySort,
  LibrarySort,
  type ListQuery,
} from "./list-tools";

const LOCALE = "en-US";

const media = {
  alien: makeMedia({
    id: 1,
    title: "Alien",
    releaseDate: "1979-05-25",
    voteAverage: 8.1,
    voteCount: 10,
    genreIds: [27, 878],
  }),
  zodiac: makeMedia({
    id: 2,
    title: "zodiac",
    releaseDate: "2007-03-02",
    voteAverage: 7.5,
    voteCount: 10,
    genreIds: [80, 18],
  }),
  dark: makeMedia({
    id: 3,
    mediaType: MediaType.Tv,
    title: "Dark",
    releaseDate: "2017-12-01",
    voteAverage: 8.4,
    voteCount: 10,
    genreIds: [18, 9648],
  }),
  tba: makeMedia({
    id: 4,
    title: "Untitled",
    releaseDate: null,
    voteAverage: 0,
    voteCount: 0,
    genreIds: [878],
  }),
};

// Added in this order (time 1..4); Alien rated 9, Dark rated 7.
const data = deepFreeze(
  [
    (d: typeof EMPTY_LIBRARY) => setWatchStatus(d, media.alien, WatchStatus.Watched, 1),
    (d: typeof EMPTY_LIBRARY) => setWatchStatus(d, media.zodiac, WatchStatus.Watched, 2),
    (d: typeof EMPTY_LIBRARY) => setWatchStatus(d, media.dark, WatchStatus.Watched, 3),
    (d: typeof EMPTY_LIBRARY) => setWatchStatus(d, media.tba, WatchStatus.Watched, 4),
    (d: typeof EMPTY_LIBRARY) => setRating(d, media.alien, 9, 5),
    (d: typeof EMPTY_LIBRARY) => setRating(d, media.dark, 7, 6),
  ].reduce((acc, step) => step(acc), EMPTY_LIBRARY),
);
const entries: ReadonlyArray<LibraryEntry> = deepFreeze(Object.values(data.entries));
// "Added" = when the status was set, so ratings (later) don't change the order.
const addedAt = (entry: LibraryEntry) =>
  (({ 1: 1, 2: 2, 3: 3, 4: 4 }) as Record<number, number>)[entry.media.id] ?? null;

const titles = (query: Partial<ListQuery>) =>
  applyListQuery(entries, { ...DEFAULT_LIST_QUERY, ...query }, addedAt, LOCALE).map(
    (entry) => entry.media.title,
  );

describe("applyListQuery: sorting", () => {
  it("recently added first by default", () => {
    expect(titles({})).toEqual(["Untitled", "Dark", "zodiac", "Alien"]);
  });

  it("title A–Z, case-insensitive", () => {
    expect(titles({ sort: LibrarySort.Title })).toEqual(["Alien", "Dark", "Untitled", "zodiac"]);
  });

  it("newest release first, unknown dates last", () => {
    expect(titles({ sort: LibrarySort.Release })).toEqual(["Dark", "zodiac", "Alien", "Untitled"]);
  });

  it("your rating, unrated last (by recently added)", () => {
    expect(titles({ sort: LibrarySort.MyRating })).toEqual(["Alien", "Dark", "Untitled", "zodiac"]);
  });

  it("TMDB rating, titles without votes last", () => {
    expect(titles({ sort: LibrarySort.TmdbRating })).toEqual([
      "Dark",
      "Alien",
      "zodiac",
      "Untitled",
    ]);
  });
});

describe("applyListQuery: filtering", () => {
  it("by type", () => {
    expect(titles({ type: MediaType.Tv })).toEqual(["Dark"]);
    expect(titles({ type: MediaType.Movie })).toHaveLength(3);
    expect(titles({ type: ALL_TYPES })).toHaveLength(4);
  });

  it("by genre, combined with type", () => {
    expect(titles({ genreId: 18 })).toEqual(["Dark", "zodiac"]);
    expect(titles({ genreId: 18, type: MediaType.Movie })).toEqual(["zodiac"]);
    expect(titles({ genreId: 12345 })).toEqual([]);
  });

  it("doesn't mutate its input", () => {
    expect(() =>
      applyListQuery(entries, { ...DEFAULT_LIST_QUERY, sort: LibrarySort.Title }, addedAt, LOCALE),
    ).not.toThrow();
  });
});

describe("genreOptions", () => {
  const names = { 18: "Drama", 27: "Horror", 80: "Crime", 878: "Science Fiction" };

  it("lists named genres present in the entries, most common first", () => {
    expect(genreOptions(entries, ALL_TYPES, names)).toEqual([
      { id: 18, name: "Drama", count: 2 },
      { id: 878, name: "Science Fiction", count: 2 },
      { id: 80, name: "Crime", count: 1 },
      { id: 27, name: "Horror", count: 1 },
    ]);
  });

  it("counts only the selected type", () => {
    expect(genreOptions(entries, MediaType.Tv, names)).toEqual([
      { id: 18, name: "Drama", count: 1 },
    ]);
  });
});

describe("helpers", () => {
  it("isLibrarySort", () => {
    expect(isLibrarySort(LibrarySort.Title)).toBe(true);
    expect(isLibrarySort("popularity")).toBe(false);
  });

  it("isDefaultQuery ignores the sort", () => {
    expect(isDefaultQuery({ ...DEFAULT_LIST_QUERY, sort: LibrarySort.Title })).toBe(true);
    expect(isDefaultQuery({ ...DEFAULT_LIST_QUERY, genreId: 18 })).toBe(false);
  });
});
