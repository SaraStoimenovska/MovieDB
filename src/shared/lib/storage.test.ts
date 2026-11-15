// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createSafeStorage, persistedStoreOptions, validatedMerge } from "@/shared/lib/storage";

afterEach(() => vi.restoreAllMocks());

describe("createSafeStorage", () => {
  const storage = createSafeStorage<{ n: number }>();

  it("round-trips values", () => {
    storage.setItem("k", { state: { n: 1 }, version: 1 });
    expect(storage.getItem("k")).toEqual({ state: { n: 1 }, version: 1 });
    storage.removeItem("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("returns null for corrupt JSON instead of throwing", () => {
    window.localStorage.setItem("k", "{not json");
    expect(storage.getItem("k")).toBeNull();
  });

  it("survives a full quota / blocked storage", () => {
    // happy-dom defines the methods on the instance, not on Storage.prototype.
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(() => storage.setItem("k", { state: { n: 1 }, version: 1 })).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });

  it("survives storage access throwing (privacy settings)", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(storage.getItem("k")).toBeNull();
  });
});

describe("validatedMerge", () => {
  const merge = validatedMerge(z.object({ n: z.number() }));
  const current = { n: 0, action: () => undefined };

  it("merges valid persisted data over the defaults, keeping actions", () => {
    expect(merge({ n: 5 }, current)).toEqual({ ...current, n: 5 });
  });

  it("ignores invalid data", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(merge({ n: "x" }, current)).toBe(current);
    expect(merge(undefined, current)).toBe(current);
  });
});

describe("persistedStoreOptions", () => {
  it("wires name, version, partialize and a default migrate", () => {
    const options = persistedStoreOptions<{ n: number; f: () => void }, { n: number }>({
      name: "mdb:x",
      version: 3,
      schema: z.object({ n: z.number() }),
      pick: (state) => ({ n: state.n }),
    });
    expect(options.name).toBe("mdb:x");
    expect(options.version).toBe(3);
    expect(options.partialize?.({ n: 2, f: () => undefined })).toEqual({ n: 2 });
    expect(options.migrate?.({ n: 9 }, 1)).toEqual({ n: 9 });
  });
});
