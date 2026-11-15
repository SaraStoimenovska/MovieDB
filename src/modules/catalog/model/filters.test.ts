import { describe, expect, it } from "vitest";
import { MediaType } from "@/shared/lib/tmdb/types";
import { deepFreeze } from "@/test/fixtures";
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  maxFilterYear,
  parseBrowseState,
  parseCatalogFilters,
  SortKey,
  switchMediaType,
  toBrowseSearchString,
  toDiscoverParams,
  toFilterSearchString,
  toSearchParamsLike,
  updateFilters,
  yearOptions,
} from "./filters";
import { parseGenreList } from "./genres";
import { catalogKeys } from "./query-keys";

const params = (query: string) => new URLSearchParams(query);
const MAX_YEAR = 2027;

describe("parseCatalogFilters", () => {
  it("returns defaults for an empty query", () => {
    expect(parseCatalogFilters(params(""), MAX_YEAR)).toEqual(DEFAULT_FILTERS);
  });

  it("parses every filter", () => {
    expect(
      parseCatalogFilters(params("sort=top_rated&genre=18&year=1999&keyword=9715"), MAX_YEAR),
    ).toEqual({
      sort: SortKey.TopRated,
      genreId: 18,
      year: 1999,
      keywordId: 9715,
    });
  });

  it.each([
    ["sort=random", { sort: SortKey.Popular }],
    ["genre=-1", { genreId: null }],
    ["genre=abc", { genreId: null }],
    ["year=1800", { year: null }],
    ["year=2099", { year: null }],
    ["keyword=1.5", { keywordId: null }],
  ])("falls back to defaults for invalid %s", (query, expected) => {
    expect(parseCatalogFilters(params(query), MAX_YEAR)).toMatchObject(expected);
  });
});

describe("toFilterSearchString", () => {
  it("omits defaults", () => {
    expect(toFilterSearchString(DEFAULT_FILTERS)).toBe("");
  });

  it("round-trips with the parser", () => {
    const filters = { sort: SortKey.Newest, genreId: 35, year: 2020, keywordId: 4 };
    expect(parseCatalogFilters(params(toFilterSearchString(filters)), MAX_YEAR)).toEqual(filters);
  });
});

describe("hasActiveFilters", () => {
  it("is false for defaults and true for any change", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, keywordId: 1 })).toBe(true);
  });
});

describe("toDiscoverParams", () => {
  it("maps movies to release-year and sort params", () => {
    expect(
      toDiscoverParams(MediaType.Movie, {
        sort: SortKey.Newest,
        genreId: 18,
        year: 1999,
        keywordId: null,
      }),
    ).toEqual({
      sort_by: "primary_release_date.desc",
      with_genres: 18,
      with_keywords: null,
      primary_release_year: 1999,
      "vote_count.gte": 20,
      include_adult: false,
    });
  });

  it("uses first-air-date params for series and a vote floor for top rated", () => {
    const result = toDiscoverParams(MediaType.Tv, {
      ...DEFAULT_FILTERS,
      sort: SortKey.TopRated,
      year: 2011,
    });
    expect(result).toMatchObject({
      sort_by: "vote_average.desc",
      first_air_date_year: 2011,
      "vote_count.gte": 300,
    });
  });
});

describe("browse state", () => {
  it("parses the media type, defaulting to movies", () => {
    expect(parseBrowseState(params("type=tv"), MAX_YEAR).mediaType).toBe(MediaType.Tv);
    expect(parseBrowseState(params("type=nope"), MAX_YEAR).mediaType).toBe(MediaType.Movie);
  });

  it.each([
    [{ mediaType: MediaType.Movie, filters: DEFAULT_FILTERS }, ""],
    [{ mediaType: MediaType.Tv, filters: DEFAULT_FILTERS }, "type=tv"],
    [{ mediaType: MediaType.Tv, filters: { ...DEFAULT_FILTERS, genreId: 18 } }, "type=tv&genre=18"],
  ])("serializes %j as %j", (state, expected) => {
    expect(toBrowseSearchString(state)).toBe(expected);
  });

  it("drops the genre (ids differ per type) but keeps sort, year and keyword when switching tab", () => {
    const state = deepFreeze({
      mediaType: MediaType.Movie,
      filters: { sort: SortKey.TopRated, genreId: 18, year: 2000, keywordId: 7 },
    });
    expect(switchMediaType(state, MediaType.Tv)).toEqual({
      mediaType: MediaType.Tv,
      filters: { sort: SortKey.TopRated, genreId: null, year: 2000, keywordId: 7 },
    });
    expect(switchMediaType(state, MediaType.Movie).filters.genreId).toBe(18);
  });

  it("adapts Next's searchParams record (arrays take the first value)", () => {
    const like = toSearchParamsLike({ type: "tv", genre: ["18", "35"], missing: undefined });
    expect([like.get("type"), like.get("genre"), like.get("missing")]).toEqual(["tv", "18", null]);
  });
});

describe("small helpers", () => {
  it("updateFilters returns a new object", () => {
    const filters = deepFreeze({ ...DEFAULT_FILTERS });
    const next = updateFilters(filters, { year: 2001 });
    expect(next).not.toBe(filters);
    expect(next.year).toBe(2001);
  });

  it("yearOptions counts down to the minimum", () => {
    expect(yearOptions(2003, 2000)).toEqual([2003, 2002, 2001, 2000]);
    expect(yearOptions(1999, 2000)).toEqual([]);
  });

  it("maxFilterYear allows next year (announced titles)", () => {
    expect(maxFilterYear(new Date("2026-06-01"))).toBe(2027);
  });

  it("catalogKeys include the media type and filters", () => {
    expect(catalogKeys.discover(MediaType.Tv, DEFAULT_FILTERS)).toEqual([
      "catalog",
      "discover",
      "tv",
      DEFAULT_FILTERS,
    ]);
  });
});

describe("parseGenreList", () => {
  it("sorts genres alphabetically", () => {
    const raw = {
      genres: [
        { id: 2, name: "Drama" },
        { id: 1, name: "Action" },
      ],
    };
    expect(parseGenreList(raw).map((g) => g.name)).toEqual(["Action", "Drama"]);
  });

  it("throws on a malformed response", () => {
    expect(() => parseGenreList({ nope: true })).toThrow();
  });
});
