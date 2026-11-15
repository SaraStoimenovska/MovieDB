import { describe, expect, it } from "vitest";
import { type MediaKey, MediaType } from "@/shared/lib/tmdb/types";
import {
  decodeSharedList,
  DEFAULT_SHARED_NAME,
  encodeSharedList,
  MAX_SHARED_ITEMS,
  MAX_SHARED_NAME_LENGTH,
  SharedParam,
  sharedListName,
} from "./shared-list";

const decode = (query: string) =>
  decodeSharedList(Object.fromEntries(new URLSearchParams(query).entries()));

describe("encodeSharedList / decodeSharedList", () => {
  it("round-trips name, types, ids and order", () => {
    const query = encodeSharedList("Sara's favorites", ["movie:550", "tv:1399", "movie:27205"]);
    expect(query).toBe("name=Sara%27s+favorites&items=m550.t1399.m27205");
    expect(decode(query)).toEqual({
      name: "Sara's favorites",
      items: [
        { mediaType: MediaType.Movie, id: 550 },
        { mediaType: MediaType.Tv, id: 1399 },
        { mediaType: MediaType.Movie, id: 27205 },
      ],
    });
  });

  it("drops duplicates and caps the number of titles", () => {
    const keys = Array.from(
      { length: MAX_SHARED_ITEMS + 10 },
      (_, index) => `movie:${index + 1}` as MediaKey,
    );
    expect(decode(encodeSharedList("x", [...keys, "movie:1"]))?.items).toHaveLength(
      MAX_SHARED_ITEMS,
    );
    expect(decode("items=m1.m1.t1")?.items).toHaveLength(2);
  });

  it("defaults and caps the name", () => {
    expect(decode(encodeSharedList("   ", ["movie:1"]))?.name).toBe(DEFAULT_SHARED_NAME);
    expect(decode("items=m1")?.name).toBe(DEFAULT_SHARED_NAME);
    expect(decode(`items=m1&name=${"a".repeat(200)}`)?.name).toHaveLength(MAX_SHARED_NAME_LENGTH);
  });

  it("skips invalid items and returns null when nothing valid is left", () => {
    expect(decode("items=m550.x12.m0.t-3.mabc.t7")?.items).toEqual([
      { mediaType: MediaType.Movie, id: 550 },
      { mediaType: MediaType.Tv, id: 7 },
    ]);
    expect(decode("items=garbage")).toBeNull();
    expect(decode("name=Empty")).toBeNull();
    expect(decodeSharedList({})).toBeNull();
  });

  it("accepts repeated params (uses the first)", () => {
    expect(decodeSharedList({ [SharedParam.Items]: ["m1", "m2"] })?.items).toEqual([
      { mediaType: MediaType.Movie, id: 1 },
    ]);
  });
});

describe("sharedListName", () => {
  it("personalizes with the display name when there is one", () => {
    expect(sharedListName("Sara", "Favorites")).toBe("Sara's favorites");
    expect(sharedListName("  ", "Want to watch")).toBe("Want to watch");
  });
});
