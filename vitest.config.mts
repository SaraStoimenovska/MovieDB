import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Pure-function tests run in plain Node (fast to start). Files that need a DOM opt in with
    // `// @vitest-environment jsdom` on line 1. Loading jsdom for every file exceeded Vitest's
    // hard-coded 60s worker start timeout on this machine.
    environment: "node",
    // Threads start much faster than forked processes on Windows (forks hit worker start timeouts).
    pool: "threads",
    // Starting many workers at once on this (AV-scanned) Windows machine hits worker start timeouts.
    maxWorkers: 2,
    // A timezone west of UTC makes date off-by-one bugs fail deterministically on every machine.
    env: { TZ: "America/Los_Angeles" },
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "src/**/model/**",
        "src/shared/utils/**",
        "src/shared/hooks/**",
        "src/modules/**/store/**",
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
