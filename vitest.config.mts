import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path("./src"),
      // `server-only` throws outside a React Server environment; tests import server modules directly.
      "server-only": path("./src/test/stubs/server-only.ts"),
    },
  },
  test: {
    // Pure-function tests run in plain Node (fast to start). Files that need a DOM opt in with
    // `// @vitest-environment happy-dom` on line 1. (jsdom was too slow to load here: it exceeded
    // Vitest's hard-coded 60s worker start timeout.)
    environment: "node",
    // Threads start much faster than forked processes on Windows (forks hit worker start timeouts).
    pool: "threads",
    // Starting many workers at once on this (AV-scanned) Windows machine hits worker start timeouts.
    maxWorkers: 2,
    // A timezone west of UTC makes date off-by-one bugs fail deterministically on every machine.
    env: { TZ: "America/Los_Angeles" },
    // A real origin, so absolute proxy URLs (`/api/tmdb/...`) resolve and MSW can match them.
    environmentOptions: { happyDOM: { url: "http://localhost:3000" } },
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "src/**/model/**",
        "src/shared/utils/**",
        "src/shared/lib/**",
        "src/shared/hooks/**",
        "src/shared/config/**",
        "src/modules/**/store/**",
      ],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/shared/lib/env.ts"],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
