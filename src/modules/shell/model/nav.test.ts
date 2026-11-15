import { describe, expect, it } from "vitest";
import { isNavItemActive } from "./nav";

describe("isNavItemActive", () => {
  it.each([
    ["/", "/", true],
    ["/movies", "/", false],
    ["/movies", "/movies", true],
    ["/movies/550", "/movies", true],
    ["/moviesxyz", "/movies", false],
    ["/tv", "/movies", false],
  ])("pathname %s with href %s → %s", (pathname, href, expected) => {
    expect(isNavItemActive(pathname, href)).toBe(expected);
  });
});
