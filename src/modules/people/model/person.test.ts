import { describe, expect, it } from "vitest";
import { rawMovie, rawTv } from "@/test/fixtures";
import {
  ageInYears,
  CreditTab,
  defaultCreditTab,
  isCreditTab,
  mergeCredits,
  parsePerson,
} from "./person";

const credit = (raw: Record<string, unknown>, extra: Record<string, unknown>) => ({
  ...raw,
  ...extra,
});

describe("mergeCredits", () => {
  it("merges roles for the same title and sorts newest first", () => {
    const credits = mergeCredits([
      credit(rawTv({ first_air_date: "2010-01-01" }), { media_type: "tv", character: "Ned" }),
      credit(rawTv({ first_air_date: "2010-01-01" }), {
        media_type: "tv",
        character: "Ned (voice)",
      }),
      credit(rawMovie({ release_date: "2020-01-01" }), { media_type: "movie", character: "Tyler" }),
    ] as never);
    expect(credits.map((c) => [c.media.key, c.role])).toEqual([
      ["movie:550", "Tyler"],
      ["tv:1399", "Ned, Ned (voice)"],
    ]);
  });

  it("puts undated (announced) titles first and drops talk shows", () => {
    const credits = mergeCredits([
      credit(rawMovie({ id: 1, release_date: "2001-01-01" }), {
        media_type: "movie",
        character: "",
      }),
      credit(rawMovie({ id: 2, release_date: "" }), { media_type: "movie", job: "Director" }),
      credit(rawTv({ id: 3, genre_ids: [10767] }), { media_type: "tv", character: "Self" }),
    ] as never);
    expect(credits.map((c) => [c.media.id, c.role])).toEqual([
      [2, "Director"],
      [1, ""],
    ]);
  });
});

describe("parsePerson", () => {
  const raw = {
    id: 287,
    name: "Brad Pitt",
    biography: null,
    known_for_department: "Acting",
    birthday: "1963-12-18",
    deathday: "",
    place_of_birth: "Shawnee, Oklahoma, USA",
    profile_path: "/p.jpg",
    imdb_id: "nm0000093",
    homepage: null,
    combined_credits: {
      cast: [
        { ...rawMovie({ id: 1, vote_count: 10 }), media_type: "movie", character: "A" },
        { ...rawMovie({ id: 2, vote_count: 900 }), media_type: "movie", character: "B" },
        { id: "broken" },
      ],
      crew: [{ ...rawMovie({ id: 3 }), media_type: "movie", job: "Producer" }],
    },
  };

  it("maps the person, filmography and known-for (most voted first)", () => {
    const person = parsePerson(raw);
    expect(person).toMatchObject({
      name: "Brad Pitt",
      biography: "",
      deathday: null,
      imdbId: "nm0000093",
    });
    expect(person.acting).toHaveLength(2);
    expect(person.crew.map((c) => c.role)).toEqual(["Producer"]);
    expect(person.knownFor.map((m) => m.id)).toEqual([2, 1]);
  });

  it("uses crew credits for known-for when the person isn't an actor", () => {
    const director = parsePerson({ ...raw, known_for_department: "Directing" });
    expect(director.knownFor.map((m) => m.id)).toEqual([3]);
    expect(defaultCreditTab(director)).toBe(CreditTab.Crew);
  });

  it("handles a person without credits", () => {
    const person = parsePerson({ id: 1, name: "Nobody" });
    expect([person.acting, person.crew, person.knownFor]).toEqual([[], [], []]);
    expect(defaultCreditTab(person)).toBe(CreditTab.Acting);
  });
});

describe("ageInYears / isCreditTab", () => {
  it.each([
    ["1963-12-18", "2026-12-17", 62],
    ["1963-12-18", "2026-12-18", 63],
    ["2000-02-29", "2026-03-01", 26],
    ["nonsense", "2026-01-01", null],
  ])("born %s, on %s → %s", (birthday, on, expected) => {
    expect(ageInYears(birthday, new Date(on))).toBe(expected);
  });

  it("recognizes credit tabs", () => {
    expect(isCreditTab("acting")).toBe(true);
    expect(isCreditTab("directing")).toBe(false);
  });
});
