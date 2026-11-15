import { describe, expect, it } from "vitest";
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatRating,
  formatRelativeTime,
  formatRuntime,
  formatYear,
} from "@/shared/utils/format";

describe("formatDate", () => {
  it.each([
    ["en-US", "Nov 14, 2026"],
    ["de", "14.11.2026"],
    ["fr", "14 nov. 2026"],
  ])("formats a date for %s", (locale, expected) => {
    expect(formatDate("2026-11-14T12:00:00Z", locale)).toBe(expected);
  });

  // Tests run with TZ=America/Los_Angeles (see vitest.config.mts), where UTC midnight is still "yesterday".
  it("keeps date-only strings on the same calendar day west of UTC", () => {
    expect(formatDate("2026-11-14", "en-US")).toBe("Nov 14, 2026");
  });

  it.each([null, undefined, "", "not-a-date"])("returns empty string for %s", (input) => {
    expect(formatDate(input, "en")).toBe("");
  });
});

describe("formatYear", () => {
  it("returns only the year", () => {
    expect(formatYear("1999-03-31", "en")).toBe("1999");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-11-14T12:00:00Z");

  it.each([
    ["2026-11-13T12:00:00Z", "en", "yesterday"],
    ["2026-11-14T09:00:00Z", "en", "3 hours ago"],
    ["2026-11-14T09:00:00Z", "de", "vor 3 Stunden"],
    ["2026-11-14T12:00:00Z", "en", "now"],
  ])("formats %s in %s", (input, locale, expected) => {
    expect(formatRelativeTime(input, locale, now)).toBe(expected);
  });

  it("returns empty string for invalid input", () => {
    expect(formatRelativeTime("nope", "en", now)).toBe("");
  });
});

describe("formatRuntime", () => {
  it.each([
    [125, "2h 5m"],
    [60, "1h"],
    [45, "45m"],
  ])("formats %i minutes", (minutes, expected) => {
    expect(formatRuntime(minutes, "en")).toBe(expected);
  });

  it.each([0, -5, null, undefined, Number.NaN])("returns empty string for %s", (minutes) => {
    expect(formatRuntime(minutes, "en")).toBe("");
  });
});

describe("formatRating", () => {
  it.each([
    [7.456, "en", "7.5"],
    [7.456, "de", "7,5"],
    [12, "en", "10.0"],
    [-1, "en", "0.0"],
  ])("formats %d in %s", (value, locale, expected) => {
    expect(formatRating(value, locale)).toBe(expected);
  });

  it("returns empty string for missing values", () => {
    expect(formatRating(null, "en")).toBe("");
  });
});

describe("formatCompactNumber", () => {
  it.each([
    [999, "999"],
    [12_345, "12.3K"],
    [1_500_000, "1.5M"],
  ])("formats %i", (value, expected) => {
    expect(formatCompactNumber(value, "en")).toBe(expected);
  });
});

describe("formatCurrency", () => {
  it("formats USD in en-US", () => {
    expect(formatCurrency(160_000_000, "en-US")).toBe("$160,000,000");
  });

  it("treats 0 as unknown (TMDB convention)", () => {
    expect(formatCurrency(0, "en-US")).toBe("");
  });
});
