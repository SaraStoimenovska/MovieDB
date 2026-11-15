import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * End-to-end tests against the production build (`pnpm build` first). TMDB is called for real
 * by the server, so a valid TMDB_API_KEY in .env.local is required.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "small-phone",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
    },
  ],
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
