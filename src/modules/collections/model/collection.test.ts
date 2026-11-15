import { describe, expect, it } from "vitest";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import { makeMedia, rawMovie } from "@/test/fixtures";
import { collectionProgress, parseCollection, sortParts } from "./collection";

describe("parseCollection", () => {
  const raw = {
    id: 86311,
    name: "The Avengers Collection",
    overview: null,
    poster_path: "/p.jpg",
    backdrop_path: "",
    parts: [
      rawMovie({ id: 3, title: "Endgame", release_date: "2019-04-24" }),
      { id: "broken" },
      rawMovie({ id: 1, title: "The Avengers", release_date: "2012-04-25" }),
      rawMovie({ id: 4, title: "Secret Wars", release_date: "" }),
      rawMovie({ id: 2, title: "Age of Ultron", release_date: "2015-04-22" }),
    ],
  };

  it("maps the collection and orders parts by release, undated last", () => {
    const collection = parseCollection(raw);
    expect(collection).toMatchObject({
      id: 86311,
      name: "The Avengers Collection",
      overview: "",
      posterPath: "/p.jpg",
      backdropPath: null,
    });
    expect(collection.parts.map((part) => part.title)).toEqual([
      "The Avengers",
      "Age of Ultron",
      "Endgame",
      "Secret Wars",
    ]);
  });

  it("skips invalid parts and tolerates a missing parts array", () => {
    expect(parseCollection(raw).parts).toHaveLength(4);
    expect(parseCollection({ ...raw, parts: undefined }).parts).toEqual([]);
  });

  it("throws on an invalid envelope", () => {
    expect(() => parseCollection({ name: "x" })).toThrow();
  });
});

describe("sortParts", () => {
  it("doesn't mutate its input", () => {
    const parts = Object.freeze([
      makeMedia({ id: 2, releaseDate: "2020-01-01" }),
      makeMedia({ id: 1, releaseDate: "2010-01-01" }),
    ]);
    expect(sortParts(parts).map((part) => part.id)).toEqual([1, 2]);
  });
});

describe("collectionProgress", () => {
  const parts = [
    makeMedia({ id: 1, releaseDate: "2012-04-25" }),
    makeMedia({ id: 2, releaseDate: "2015-04-22" }),
    makeMedia({ id: 3, releaseDate: "2019-04-24" }),
    makeMedia({ id: 4, releaseDate: "2027-05-01" }), // unreleased
    makeMedia({ id: 5, releaseDate: null }), // announced, no date
  ];
  const watched =
    (...ids: number[]) =>
    (key: MediaKey) =>
      ids.some((id) => key === `movie:${id}`);
  const today = "2026-11-15";

  it("counts only released films", () => {
    expect(collectionProgress(parts, watched(1, 3), today)).toEqual({
      watched: 2,
      total: 3,
      percent: 67,
    });
  });

  it("still counts an unreleased film you marked as watched", () => {
    expect(collectionProgress(parts, watched(4), today)).toEqual({
      watched: 1,
      total: 4,
      percent: 25,
    });
  });

  it("handles nothing released yet", () => {
    expect(collectionProgress(parts.slice(3), watched(), today)).toEqual({
      watched: 0,
      total: 0,
      percent: 0,
    });
  });
});
