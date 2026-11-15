import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Every page, checked on every viewport project (desktop, tablet, mobile, small phone). */
const PAGES = [
  { name: "home", path: "/" },
  { name: "browse-movies", path: "/browse" },
  { name: "browse-series", path: "/browse?type=tv&sort=top_rated" },
  { name: "movie", path: "/movie/550" },
  { name: "series", path: "/tv/1399" },
  { name: "person", path: "/person/287" },
  { name: "search", path: "/search?q=matrix" },
  { name: "favorites", path: "/favorites" },
  { name: "my-list", path: "/my-list" },
  { name: "stats", path: "/stats" },
  { name: "preferences", path: "/preferences" },
] as const;

for (const page of PAGES) {
  test(`${page.name}: no horizontal scrolling, nothing cut off`, async ({
    page: browser,
  }, info) => {
    await browser.goto(page.path);
    await expect(browser.locator("main")).toBeVisible();
    // Let streamed sections and images settle before measuring.
    await browser.waitForLoadState("networkidle");

    const overflow = await browser.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          // Horizontal scrollers (carousels, cast rows) clip their children on purpose.
          const insideScroller = el.closest(
            "[class*='overflow-x-auto'], [class*='overflow-hidden']",
          );
          return !insideScroller && rect.width > 0 && rect.right > viewport + 1;
        })
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 60)}`);
      return { scrollWidth: document.documentElement.scrollWidth, viewport, offenders };
    });

    await browser.screenshot({
      path: `test-results/screens/${info.project.name}-${page.name}.png`,
      fullPage: true,
    });
    expect(
      overflow.offenders,
      `elements wider than the viewport: ${overflow.offenders.join(", ")}`,
    ).toEqual([]);
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewport + 1);
  });
}

test("key pages have no serious accessibility violations", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "axe once is enough; layout checks run per viewport");
  for (const path of ["/", "/browse", "/movie/550", "/preferences"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious.map((v) => `${path}: ${v.id} (${v.nodes.length})`)).toEqual([]);
  }
});
