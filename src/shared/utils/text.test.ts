import { describe, expect, it } from "vitest";
import { toDomId } from "@/shared/utils/dom";
import { createId } from "@/shared/utils/id";
import { ELLIPSIS, normalizeUserText, pluralize, truncate } from "@/shared/utils/text";

describe("truncate", () => {
  it("leaves short text untouched", () => {
    expect(truncate("short", 10)).toBe("short");
  });

  it("cuts to the limit including the ellipsis, without trailing whitespace", () => {
    const result = truncate("The quick brown fox jumps", 11);
    expect(result).toBe(`The quick${ELLIPSIS}`);
    expect(result.length).toBeLessThanOrEqual(11);
  });

  it("handles a limit of zero", () => {
    expect(truncate("abc", 0)).toBe(ELLIPSIS);
  });
});

describe("pluralize", () => {
  it.each([
    [0, "0 seasons"],
    [1, "1 season"],
    [2, "2 seasons"],
  ])("%i → %s", (count, expected) => {
    expect(pluralize(count, "season")).toBe(expected);
  });

  it("supports irregular plurals", () => {
    expect(pluralize(2, "person", "people")).toBe("2 people");
  });
});

describe("normalizeUserText", () => {
  it("trims, normalizes Windows newlines and collapses blank-line runs", () => {
    expect(normalizeUserText("  a\r\n\r\n\r\n\r\nb  ")).toBe("a\n\nb");
  });

  it("returns empty for whitespace-only input", () => {
    expect(normalizeUserText(" \n\t ")).toBe("");
  });
});

describe("toDomId", () => {
  it("builds a stable, valid id", () => {
    expect(toDomId("carousel", "Trending movies — this week!")).toBe(
      "carousel-trending-movies-this-week",
    );
  });
});

describe("createId", () => {
  it("creates unique ids", () => {
    const ids = new Set(Array.from({ length: 50 }, createId));
    expect(ids.size).toBe(50);
  });
});
