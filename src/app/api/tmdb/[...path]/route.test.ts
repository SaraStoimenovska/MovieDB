import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Plain function + recorded calls instead of i.fn: when a i.fn returns a promise that
 * rejects, Vitest's own result tracking surfaces it as an unhandled rejection even though the
 * route catches it. ehavior.next is swapped per test.
 */
const behavior = vi.hoisted(() => ({
  next: async (): Promise<unknown> => ({}),
  calls: [] as Array<ReadonlyArray<unknown>>,
}));

const client = vi.hoisted(() => ({
  tmdbGetCached: (...args: ReadonlyArray<unknown>) => {
    behavior.calls.push(args);
    return behavior.next();
  },
  isTmdbRequestError: (error: unknown) => error instanceof Error && "status" in error,
}));
vi.mock("@/shared/lib/tmdb/client", () => client);

const call = async (path: ReadonlyArray<string>, query = "") => {
  const { GET } = await import("@/app/api/tmdb/[...path]/route");
  return GET(
    { nextUrl: new URL(`http://localhost/api/tmdb/${path.join("/")}${query}`) } as NextRequest,
    { params: Promise.resolve({ path: [...path] }) },
  );
};

beforeEach(() => {
  behavior.calls.length = 0;
});

describe("GET /api/tmdb/[...path]", () => {
  it("proxies allowed endpoints with only allowed params, and sets cache headers", async () => {
    behavior.next = async () => ({ page: 1, results: [] });
    const response = await call(
      ["discover", "movie"],
      "?page=2&api_key=stolen&sort_by=popularity.desc",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ page: 1, results: [] });
    expect(behavior.calls).toEqual([["discover/movie", { page: "2", sort_by: "popularity.desc" }]]);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=");
  });

  it.each([[["account"]], [["movie", "550", "..", "..", "account"]], [["person", "1"]]])(
    "rejects %j without calling TMDB",
    async (path) => {
      const response = await call(path);
      expect(response.status).toBe(404);
      expect(behavior.calls).toEqual([]);
    },
  );

  // Lazy rejection (`async () => { throw }`): an eagerly rejected promise is reported by Vitest
  // as unhandled before the route gets to await (and catch) it.
  it("passes TMDB's status through", async () => {
    behavior.next = async () => {
      throw Object.assign(new Error("rate limited"), { status: 429 });
    };
    expect((await call(["movie", "550"])).status).toBe(429);
  });

  it("returns 502 for network failures", async () => {
    behavior.next = async () => {
      throw new TypeError("fetch failed");
    };
    expect((await call(["movie", "550"])).status).toBe(502);
  });
});
