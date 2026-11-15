import { expect, type Page, test } from "@playwright/test";

/** User flows run once, on desktop (viewport behaviour is covered by responsive.spec). */
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "desktop", "flows run on desktop only");
});

const cards = (page: Page) => page.locator("main article");

test("browse: tabs switch type and infinite scroll loads more", async ({ page }) => {
  await page.goto("/browse");
  await expect(cards(page).first()).toBeVisible();
  const initial = await cards(page).count();
  expect(initial).toBeGreaterThanOrEqual(18);

  await page.getByRole("tab", { name: "Series" }).click();
  await expect(page).toHaveURL(/type=tv/);
  await expect(page.locator('main a[href^="/tv/"]').first()).toBeVisible();

  await page.mouse.wheel(0, 20_000);
  await expect.poll(() => cards(page).count(), { timeout: 20_000 }).toBeGreaterThan(initial);
});

test("search: header suggestions open a details page", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("/");
  await page.keyboard.type("fight club");
  await page
    // Anchored: the first row is "Search for “fight club”" (opens the results page instead).
    .getByRole("option", { name: /^fight club/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/movie\/550/);
  await expect(page.getByRole("heading", { level: 1, name: "Fight Club" })).toBeVisible();
});

test("library: favorite, rate and note survive a reload", async ({ page }) => {
  await page.goto("/movie/550");
  await page.getByRole("button", { name: "Add to favorites" }).click();
  await page.locator("main fieldset").first().getByText("8 out of 10").click({ force: true });
  await page.getByLabel(/your private notes/i).fill("Rewatch the twist.");
  await page.getByLabel(/your private notes/i).blur();

  await page.reload();
  await expect(page.getByRole("button", { name: "In favorites" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByLabel(/your private notes/i)).toHaveValue("Rewatch the twist.");

  await page.goto("/favorites");
  await expect(page.getByRole("heading", { name: "Fight Club" })).toBeVisible();

  await page.goto("/stats");
  await expect(page.getByText("Movies watched").locator("..")).toContainText("1");
  await expect(page.getByText("Average rating").locator("..")).toContainText("8.0/10");
});

test("reviews: post a review and a comment", async ({ page }) => {
  await page.goto("/movie/550");
  await page.getByRole("button", { name: /write a review/i }).click();
  const form = page.getByRole("form", { name: /post review/i });
  await form.getByLabel("Your name").fill("E2E");
  await form.getByText("9 out of 10").click({ force: true });
  await form.getByLabel(/^review$/i).fill("Holds up brilliantly on every rewatch.");
  await form.getByRole("button", { name: /post review/i }).click();
  await expect(page.getByText("Holds up brilliantly on every rewatch.")).toBeVisible();

  await page
    .getByRole("button", { name: /^comment$/i })
    .first()
    .click();
  const commentForm = page.getByRole("form", { name: "Comment" });
  await commentForm.getByLabel("Add a comment…").fill("Totally agree");
  await commentForm.getByRole("button", { name: "Comment" }).click();
  await expect(page.getByText("Totally agree")).toBeVisible();
});

test("people: cast links to the person page with filmography", async ({ page }) => {
  await page.goto("/movie/550");
  await page
    .getByRole("link", { name: /brad pitt/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/person\/287/);
  await expect(page.getByRole("heading", { name: "Filmography" })).toBeVisible();
});

test("preferences: dark theme persists across reloads", async ({ page }) => {
  await page.goto("/preferences");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("mobile menu and user menu reach every destination", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Your stats" }).click();
  await expect(page).toHaveURL(/\/stats/);

  await page.getByRole("button", { name: "Your account" }).click();
  await page.getByRole("menuitem", { name: "Preferences" }).click();
  await expect(page).toHaveURL(/\/preferences/);
});
