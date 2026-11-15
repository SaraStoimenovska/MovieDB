---
name: probe
description: Reproduce or inspect a UI behavior in the real app with a throwaway Playwright script against the production build — screenshot, page text, console errors, localStorage dump, element measurements. Use when a user reports a visual or behavioral bug, to confirm a fix in the browser, or to see what the app stores.
---

# Probe the running app

Unit tests can pass while the real page is wrong. A probe drives the real app once, collects
evidence, and is deleted afterwards. Playwright starts the prod server itself
(`playwright.config.ts` `webServer`), so a **fresh `pnpm build`** must exist first.

## Steps

1. `pnpm build` if source changed since the last build (takes a few minutes here; run it in the
   background and wait for the notification).
2. Write `tests/e2e/zz-probe.spec.ts` (the `zz-` prefix marks it as temporary):

```ts
import { test } from "@playwright/test";
import { writeFileSync } from "node:fs";

test("probe", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => errors.push(`PAGEERROR ${String(e).slice(0, 300)}`));

  await page.goto("/movie/550");
  // …reproduce the user's steps: clicks, typing, navigation…
  await page.waitForTimeout(1500);

  await page.screenshot({ path: "test-results/probe.png", fullPage: false });
  const storage = await page.evaluate(() =>
    Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])),
  );
  const text = (await page.locator("main").innerText()).slice(0, 800);
  writeFileSync("test-results/probe.json", JSON.stringify({ errors, storage, text }, null, 2));
});
```

3. Run one viewport:
   `pnpm exec playwright test tests/e2e/zz-probe.spec.ts --project=desktop --reporter=line`
   (other projects: see `playwright.config.ts`, e.g. mobile widths for layout bugs).
4. Read `test-results/probe.json` and **look at** `test-results/probe.png` with the Read tool.
5. **Delete** `tests/e2e/zz-probe.spec.ts` (`test-results/` is gitignored).

## Tips

- Measure instead of guessing: `locator.evaluate((el) => getComputedStyle(el).opacity)`,
  `boundingBox()`, `count()`.
- Wait for carousels/animations to settle before measuring (they start disabled/hidden).
- Scope selectors to a section: `page.locator("section", { has: page.getByRole("heading", { name: /where to watch/i }) })`.
- Slow a route to catch loading states: `page.route("**/path**", async (r) => { await new Promise((f) => setTimeout(f, 1500)); await r.continue(); })`.
- To compare with TMDB's raw data, call the app's proxy: `page.request.get("/api/tmdb/movie/550")`.
  Never read `.env.local` (the secret guard blocks it).
- Console output on Windows may show garbled non-ASCII characters (e.g. the `★` star) because of
  the console's encoding; check the source file, not the console.

## Report

State what you saw (with the screenshot), whether it reproduces, and the cause, before fixing.
