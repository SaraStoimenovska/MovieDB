import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// DOM cleanup only for files running in jsdom (pure-function tests run in plain Node).
afterEach(async () => {
  if (typeof window === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
  window.localStorage.clear();
});
