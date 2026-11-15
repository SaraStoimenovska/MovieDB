import { describe, expect, it } from "vitest";
import {
  buildTmdbUrl,
  isAllowedTmdbPath,
  pickAllowedQuery,
  toSearchParams,
} from "@/shared/lib/tmdb/request";

describe("isAllowedTmdbPath", () => {
  it.each([
    "trending/all/week",
    "trending/movie/day",
    "discover/movie",
    "discover/tv",
    "search/multi",
    "genre/tv/list",
    "movie/550",
    "tv/1399/credits",
    "/movie/550/",
    "movie/550/watch/providers",
    "tv/1399/season/2",
    "movie/550/recommendations",
  ])("allows %s", (path) => {
    expect(isAllowedTmdbPath(path)).toBe(true);
  });

  it.each([
    "",
    "account",
    "authentication/token/new",
    "movie/550/account_states",
    "movie/abc",
    "movie/550/../../account",
    "discover/person",
    "trending/all/month",
    "movie/550/season/1",
    "tv/1399/season/abc",
    "person/287",
  ])("rejects %s", (path) => {
    expect(isAllowedTmdbPath(path)).toBe(false);
  });
});

describe("pickAllowedQuery", () => {
  it("keeps allowed keys and drops everything else, including api_key", () => {
    const params = new URLSearchParams({
      page: "2",
      sort_by: "popularity.desc",
      api_key: "stolen",
      session_id: "x",
    });
    expect(pickAllowedQuery(params)).toEqual({ page: "2", sort_by: "popularity.desc" });
  });

  it("forwards the keyword filter", () => {
    expect(pickAllowedQuery(new URLSearchParams({ with_keywords: "9715" }))).toEqual({
      with_keywords: "9715",
    });
  });

  it("drops oversized values", () => {
    const params = new URLSearchParams({ query: "a".repeat(201) });
    expect(pickAllowedQuery(params)).toEqual({});
  });
});

describe("toSearchParams", () => {
  it("drops empty, null and undefined values and stringifies the rest", () => {
    const result = toSearchParams({ a: "", b: null, c: undefined, d: 0, e: false, f: "x" });
    expect(result.toString()).toBe("d=0&e=false&f=x");
  });
});

describe("buildTmdbUrl", () => {
  it("joins base and path cleanly and appends the api key", () => {
    expect(
      buildTmdbUrl("https://api.example.com/3/", "/movie/550", { language: "en-US" }, "k"),
    ).toBe("https://api.example.com/3/movie/550?language=en-US&api_key=k");
  });

  it("does not let callers override the api key", () => {
    const url = buildTmdbUrl("https://x/3", "discover/movie", { api_key: "evil" }, "real");
    expect(new URL(url).searchParams.getAll("api_key")).toEqual(["real"]);
  });
});
