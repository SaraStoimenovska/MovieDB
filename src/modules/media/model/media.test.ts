import { describe, expect, it } from "vitest";
import { MediaType } from "@/shared/lib/tmdb/types";
import { deepFreeze, makeMedia } from "@/test/fixtures";
import { flattenUniquePages } from "./media-list";
import { mediaMetaLine } from "./meta";

const page = (ids: ReadonlyArray<number>, pageNumber = 1) => ({
  page: pageNumber,
  totalPages: 3,
  totalResults: 60,
  results: ids.map((id) => makeMedia({ id })),
});

describe("flattenUniquePages", () => {
  it("flattens pages in order", () => {
    expect(flattenUniquePages([page([1, 2]), page([3], 2)]).map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("keeps only the first occurrence of a title repeated across pages", () => {
    const result = flattenUniquePages(deepFreeze([page([1, 2]), page([2, 3], 2)]));
    expect(result.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("treats a movie and a series with the same id as different titles", () => {
    const pages = [
      {
        ...page([]),
        results: [makeMedia({ id: 1 }), makeMedia({ id: 1, mediaType: MediaType.Tv })],
      },
    ];
    expect(flattenUniquePages(pages)).toHaveLength(2);
  });

  it("handles no pages", () => {
    expect(flattenUniquePages([])).toEqual([]);
  });
});

describe("mediaMetaLine", () => {
  it.each([
    [{ mediaType: MediaType.Movie, releaseDate: "1999-10-15" }, "Movie · 1999"],
    [{ mediaType: MediaType.Tv, releaseDate: null }, "Series"],
  ])("%j → %s", (media, expected) => {
    expect(mediaMetaLine(media, "en-US")).toBe(expected);
  });
});
