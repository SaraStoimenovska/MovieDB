import { describe, expect, it } from "vitest";
import { isTrackedNavigationClick, type NavigationClick, pageKey } from "./navigation-progress";

const here = new URL("http://localhost:3000/browse?type=movie");

const click = (overrides: Partial<NavigationClick> = {}): NavigationClick => ({
  button: 0,
  modifier: false,
  defaultPrevented: false,
  anchor: { href: "http://localhost:3000/movie/550", target: "", download: false },
  ...overrides,
});

describe("isTrackedNavigationClick", () => {
  it("tracks a plain click on an internal link to another page", () => {
    expect(isTrackedNavigationClick(click(), here)).toBe(true);
  });

  it("tracks a query-only change (browse tabs) and relative hrefs", () => {
    expect(
      isTrackedNavigationClick(
        click({ anchor: { href: "/browse?type=tv", target: "", download: false } }),
        here,
      ),
    ).toBe(true);
  });

  it.each<[string, Partial<NavigationClick>]>([
    ["not a link", { anchor: null }],
    ["middle click", { button: 1 }],
    ["modifier (new tab)", { modifier: true }],
    ["already handled", { defaultPrevented: true }],
    ["opens a new tab", { anchor: { href: "/stats", target: "_blank", download: false } }],
    ["download", { anchor: { href: "/backup.json", target: "", download: true } }],
    [
      "other origin",
      { anchor: { href: "https://www.themoviedb.org/", target: "", download: false } },
    ],
    ["same page", { anchor: { href: "/browse?type=movie", target: "", download: false } }],
    ["hash only", { anchor: { href: "/browse?type=movie#top", target: "", download: false } }],
  ])("ignores: %s", (_label, overrides) => {
    expect(isTrackedNavigationClick(click(overrides), here)).toBe(false);
  });

  it("accepts target=_self", () => {
    expect(
      isTrackedNavigationClick(
        click({ anchor: { href: "/stats", target: "_self", download: false } }),
        here,
      ),
    ).toBe(true);
  });
});

describe("pageKey", () => {
  it("is path + query, without the hash", () => {
    expect(pageKey(new URL("http://x.test/a?b=1#c"))).toBe("/a?b=1");
  });
});
