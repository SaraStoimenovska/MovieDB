import { describe, expect, it } from "vitest";
import {
  getNextPageParam,
  normalizeDate,
  parseDetailsSummary,
  parseMovieList,
  parseMoviePage,
  parseMultiPage,
  parseTvPage,
} from "@/shared/lib/tmdb/mappers";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { MediaType } from "@/shared/lib/tmdb/types";
import { rawMovie as fixtureMovie, rawTv as fixtureTv } from "@/test/fixtures";

const rawMovie = {
  id: 550,
  title: "Fight Club",
  overview: "An insomniac office worker…",
  poster_path: "/poster.jpg",
  backdrop_path: null,
  release_date: "1999-10-15",
  vote_average: 8.4,
  vote_count: 30000,
  genre_ids: [18],
  popularity: 70.1,
};

const rawTv = {
  id: 1399,
  name: "Game of Thrones",
  overview: "",
  poster_path: null,
  backdrop_path: "/bd.jpg",
  first_air_date: "",
  vote_average: 8.5,
  vote_count: 25000,
  genre_ids: [10765],
};

const page = (results: ReadonlyArray<unknown>, extra = {}) =>
  Object.freeze({ page: 1, total_pages: 3, total_results: 60, results, ...extra });

describe("normalizeDate", () => {
  it.each([
    ["1999-10-15", "1999-10-15"],
    ["", null],
    [null, null],
    ["1999", null],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeDate(input)).toBe(expected);
  });
});

describe("parseMoviePage", () => {
  it("maps TMDB movies to domain summaries", () => {
    const result = parseMoviePage(page([rawMovie]));
    expect(result).toEqual({
      page: 1,
      totalPages: 3,
      totalResults: 60,
      results: [
        {
          key: "movie:550",
          id: 550,
          mediaType: "movie",
          title: "Fight Club",
          overview: "An insomniac office worker…",
          posterPath: "/poster.jpg",
          backdropPath: null,
          releaseDate: "1999-10-15",
          voteAverage: 8.4,
          voteCount: 30000,
          genreIds: [18],
        },
      ],
    });
  });

  it("skips invalid items instead of failing the whole page", () => {
    const result = parseMoviePage(page([rawMovie, { id: "nope" }, { title: "no id" }]));
    expect(result.results.map((m) => m.id)).toEqual([550]);
  });

  it("fills defaults for missing optional fields", () => {
    const [movie] = parseMoviePage(page([{ id: 1, title: "Bare" }])).results;
    expect(movie).toMatchObject({ overview: "", posterPath: null, voteAverage: 0, genreIds: [] });
  });

  it("throws when the envelope itself is invalid", () => {
    expect(() => parseMoviePage({ results: [] })).toThrow();
  });

  it("does not mutate the raw response", () => {
    const raw = page([Object.freeze({ ...rawMovie })]);
    expect(() => parseMoviePage(raw)).not.toThrow();
  });
});

describe("parseTvPage", () => {
  it("maps name and first_air_date, normalizing empty dates", () => {
    const [tv] = parseTvPage(page([rawTv])).results;
    expect(tv).toMatchObject({
      key: "tv:1399",
      mediaType: "tv",
      title: "Game of Thrones",
      releaseDate: null,
    });
  });
});

describe("parseMultiPage", () => {
  it("keeps movies and series and drops people", () => {
    const result = parseMultiPage(
      page([
        { ...rawMovie, media_type: "movie" },
        { id: 287, name: "Brad Pitt", media_type: "person" },
        { ...rawTv, media_type: "tv" },
      ]),
    );
    expect(result.results.map((m) => m.key)).toEqual(["movie:550", "tv:1399"]);
  });
});

describe("getNextPageParam", () => {
  it.each([
    [1, 3, 2],
    [3, 3, undefined],
    [500, 900, undefined],
  ])("page %i of %i → %s", (current, total, expected) => {
    expect(
      getNextPageParam({ page: current, totalPages: total, totalResults: 0, results: [] }),
    ).toBe(expected);
  });
});

describe("tmdbImageUrl", () => {
  it("builds a sized CDN URL", () => {
    expect(tmdbImageUrl("/poster.jpg", "w500")).toBe("https://image.tmdb.org/t/p/w500/poster.jpg");
  });

  it("returns null without a path", () => {
    expect(tmdbImageUrl(null)).toBeNull();
  });
});

describe("parseDetailsSummary", () => {
  it("turns a details response (genres objects) into a card summary", () => {
    const { genre_ids: _ids, ...details } = fixtureMovie();
    const summary = parseDetailsSummary(MediaType.Movie, {
      ...details,
      genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }, { name: "no id" }],
    });
    expect(summary).toMatchObject({ key: "movie:550", title: "Fight Club", genreIds: [18, 53] });
  });

  it("works for series and returns null for junk", () => {
    expect(parseDetailsSummary(MediaType.Tv, fixtureTv())?.key).toBe("tv:1399");
    expect(parseDetailsSummary(MediaType.Movie, { id: "x" })).toBeNull();
    expect(parseDetailsSummary(MediaType.Movie, null)).toBeNull();
  });
});

describe("parseMovieList", () => {
  it("parses valid movies and skips the rest", () => {
    expect(parseMovieList([fixtureMovie(), { id: "bad" }]).map((movie) => movie.id)).toEqual([550]);
    expect(parseMovieList("not an array")).toEqual([]);
  });
});
