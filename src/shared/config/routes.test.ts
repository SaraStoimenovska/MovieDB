import { describe, expect, it } from "vitest";
import { isValidRating, RATING_SCALE } from "@/shared/config/rating";
import { mainNav, routes, userNav } from "@/shared/config/routes";
import { MediaType } from "@/shared/lib/tmdb/types";

describe("routes", () => {
  it.each([
    [routes.browse(), "/browse"],
    [routes.browse(MediaType.Movie), "/browse"],
    [routes.browse(MediaType.Tv), "/browse?type=tv"],
    [routes.browse({ mediaType: MediaType.Tv, genreId: 18 }), "/browse?type=tv&genre=18"],
    [routes.browse({ keywordId: 9715 }), "/browse?keyword=9715"],
    [routes.search(), "/search"],
    [routes.search("star wars"), "/search?q=star+wars"],
    [routes.media(MediaType.Movie, 550), "/movie/550"],
    [routes.media(MediaType.Tv, 1399), "/tv/1399"],
    [routes.person(287), "/person/287"],
  ])("%s", (actual, expected) => {
    expect(actual).toBe(expected);
  });

  it("keeps primary navigation short and personal pages in the user menu", () => {
    expect(mainNav.map((item) => item.label)).toEqual(["Home", "Browse"]);
    expect(userNav.map((item) => item.href)).toContain(routes.favorites());
  });
});

describe("isValidRating", () => {
  it.each([
    [RATING_SCALE.min, true],
    [RATING_SCALE.max, true],
    [0, false],
    [11, false],
    [7.5, false],
    ["7", false],
  ])("%j → %s", (value, expected) => {
    expect(isValidRating(value)).toBe(expected);
  });
});
