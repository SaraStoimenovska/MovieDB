import { describe, expect, it } from "vitest";
import { parseTmdbId } from "@/shared/lib/tmdb/ids";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import {
  isMediaKey,
  isMediaType,
  MEDIA_TYPE_LABELS,
  MEDIA_TYPES,
  MediaType,
  toMediaKey,
} from "@/shared/lib/tmdb/types";

describe("MediaType", () => {
  it("lists every type with a label", () => {
    expect(MEDIA_TYPES).toEqual(["movie", "tv"]);
    MEDIA_TYPES.forEach((type) => expect(MEDIA_TYPE_LABELS[type]).toBeTruthy());
  });

  it.each([
    ["movie", true],
    ["tv", true],
    ["person", false],
    [42, false],
  ])("isMediaType(%j) → %s", (value, expected) => {
    expect(isMediaType(value)).toBe(expected);
  });
});

describe("media keys", () => {
  it("builds keys from type and id", () => {
    expect(toMediaKey(MediaType.Tv, 1399)).toBe("tv:1399");
  });

  it.each([
    ["movie:550", true],
    ["tv:1", true],
    ["person:1", false],
    ["movie:", false],
    ["movie:abc", false],
    [null, false],
  ])("isMediaKey(%j) → %s", (value, expected) => {
    expect(isMediaKey(value)).toBe(expected);
  });
});

describe("parseTmdbId", () => {
  it.each([
    ["550", 550],
    ["0", null],
    ["-1", null],
    ["12abc", null],
    ["", null],
    ["12345678901", null],
  ])("%j → %s", (value, expected) => {
    expect(parseTmdbId(value)).toBe(expected);
  });
});

describe("tmdbImageUrl", () => {
  it("strips duplicate leading slashes", () => {
    expect(tmdbImageUrl("//x.jpg", "w92")).toBe("https://image.tmdb.org/t/p/w92/x.jpg");
  });

  it("defaults to w342", () => {
    expect(tmdbImageUrl("/x.jpg")).toContain("/w342/");
  });
});
