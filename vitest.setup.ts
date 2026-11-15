import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "@/test/msw/server";

// `"use cache"` functions run as plain functions in tests; their cache APIs become no-ops.
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
}));

// Every network request must be mocked: an unhandled request fails the test loudly.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// DOM cleanup only for files running in jsdom (pure-function tests run in plain Node).
afterEach(async () => {
  if (typeof window === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
  window.localStorage.clear();
});
