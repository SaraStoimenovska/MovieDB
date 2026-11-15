import { describe, expect, it } from "vitest";
import { isSearchable, MAX_QUERY_LENGTH, normalizeQuery, searchKeys } from "./search";

describe("normalizeQuery", () => {
  it.each([
    ["  star   wars ", "star wars"],
    [null, ""],
    [undefined, ""],
    ["\tdune\n", "dune"],
  ])("%j → %j", (input, expected) => {
    expect(normalizeQuery(input)).toBe(expected);
  });

  it("caps the length", () => {
    expect(normalizeQuery("a".repeat(500))).toHaveLength(MAX_QUERY_LENGTH);
  });
});

describe("isSearchable", () => {
  it.each([
    ["", false],
    ["a", false],
    ["ab", true],
  ])("%j → %s", (query, expected) => {
    expect(isSearchable(query)).toBe(expected);
  });
});

describe("searchKeys", () => {
  it("separates results and suggestions per query", () => {
    expect(searchKeys.multi("dune")).not.toEqual(searchKeys.suggestions("dune"));
  });
});
