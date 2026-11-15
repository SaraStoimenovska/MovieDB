import { describe, expect, it } from "vitest";
import { deepFreeze, rawPage } from "@/test/fixtures";
import {
  EMPTY_EPISODES,
  episodeKey,
  episodesDataSchema,
  formatEpisodeRef,
  isEpisodeWatched,
  nextEpisode,
  progressSummary,
  removeShow,
  selectEpisodeTotals,
  selectUpNext,
  setSeasonWatched,
  type ShowRef,
  toggleEpisode,
  watchedInSeason,
} from "./episodes";
import { hasAired, parseSeasonEpisodes, todayIso } from "./season";

const show: ShowRef = { key: "tv:1399", id: 1399, title: "GoT", posterPath: null };
const seasons = deepFreeze([
  { number: 0, name: "Specials", episodeCount: 5 },
  { number: 1, name: "Season 1", episodeCount: 2 },
  { number: 2, name: "Season 2", episodeCount: 2 },
]);
const empty = deepFreeze(EMPTY_EPISODES);

describe("toggleEpisode", () => {
  it("marks and unmarks an episode, dropping the show when nothing is watched", () => {
    const marked = deepFreeze(
      toggleEpisode(empty, show, seasons, { season: 1, episode: 1 }, 60, 10),
    );
    const progress = marked.shows[show.key]!;
    expect(isEpisodeWatched(progress, { season: 1, episode: 1 })).toBe(true);
    expect(progress.watched[episodeKey(1, 1)]).toEqual({ watchedAt: 10, runtimeMinutes: 60 });

    expect(toggleEpisode(marked, show, seasons, { season: 1, episode: 1 }, 60, 11)).toEqual(
      EMPTY_EPISODES,
    );
  });
});

describe("setSeasonWatched", () => {
  const episodes = [
    { number: 1, runtimeMinutes: 50 },
    { number: 2, runtimeMinutes: 55 },
  ];

  it("marks a whole season, keeping earlier watch dates", () => {
    const one = deepFreeze(toggleEpisode(empty, show, seasons, { season: 1, episode: 1 }, 50, 1));
    const all = setSeasonWatched(one, show, seasons, 1, episodes, true, 9);
    const progress = all.shows[show.key]!;
    expect(watchedInSeason(progress, 1)).toBe(2);
    expect(progress.watched[episodeKey(1, 1)]?.watchedAt).toBe(1);
    expect(progress.watched[episodeKey(1, 2)]?.watchedAt).toBe(9);
  });

  it("unmarks a season without touching others", () => {
    const both = deepFreeze(
      setSeasonWatched(
        setSeasonWatched(empty, show, seasons, 1, episodes, true, 1),
        show,
        seasons,
        2,
        episodes,
        true,
        2,
      ),
    );
    const progress = setSeasonWatched(both, show, seasons, 1, episodes, false, 3).shows[show.key]!;
    expect([watchedInSeason(progress, 1), watchedInSeason(progress, 2)]).toEqual([0, 2]);
  });
});

describe("progress and up next", () => {
  const data = deepFreeze(
    setSeasonWatched(
      empty,
      show,
      seasons,
      1,
      [
        { number: 1, runtimeMinutes: 50 },
        { number: 2, runtimeMinutes: 55 },
      ],
      true,
      5,
    ),
  );
  const progress = data.shows[show.key]!;

  it("summarizes progress over regular seasons only (specials excluded)", () => {
    expect(progressSummary(progress)).toEqual({ watched: 2, total: 4, percent: 50 });
    expect(progressSummary(null)).toEqual({ watched: 0, total: 0, percent: 0 });
  });

  it("finds the next unwatched regular episode", () => {
    expect(nextEpisode(progress)).toEqual({ season: 2, episode: 1 });
    expect(formatEpisodeRef({ season: 2, episode: 1 })).toBe("S2 E1");
  });

  it("returns null when the show is finished, and leaves it out of Up next", () => {
    const done = setSeasonWatched(
      data,
      show,
      seasons,
      2,
      [
        { number: 1, runtimeMinutes: 1 },
        { number: 2, runtimeMinutes: 1 },
      ],
      true,
      6,
    );
    expect(nextEpisode(done.shows[show.key]!)).toBeNull();
    expect(selectUpNext(done)).toEqual([]);
  });

  it("lists started shows in Up next, most recent first", () => {
    const other: ShowRef = { key: "tv:1", id: 1, title: "Other", posterPath: null };
    const both = toggleEpisode(
      data,
      other,
      [{ number: 1, name: "S1", episodeCount: 3 }],
      { season: 1, episode: 1 },
      null,
      99,
    );
    expect(selectUpNext(both).map((item) => item.progress.show.id)).toEqual([1, 1399]);
  });

  it("totals watched episodes and runtime", () => {
    expect(selectEpisodeTotals(data)).toEqual({ episodes: 2, minutes: 105 });
  });

  it("removes a show", () => {
    expect(removeShow(data, show.key)).toEqual(EMPTY_EPISODES);
  });

  it("validates persisted data", () => {
    expect(episodesDataSchema.safeParse(data).success).toBe(true);
    expect(
      episodesDataSchema.safeParse({ shows: { [show.key]: { watched: { bad: 1 } } } }).success,
    ).toBe(false);
  });
});

describe("season parsing", () => {
  it("maps episodes, skipping invalid items and sorting by number", () => {
    const raw = {
      ...rawPage([]),
      episodes: [
        { episode_number: 2, name: "B", air_date: "2011-04-24", runtime: 56 },
        { episode_number: "x" },
        {
          episode_number: 1,
          name: null,
          air_date: "",
          runtime: 0,
          still_path: "/s.jpg",
          overview: "o",
        },
      ],
    };
    expect(parseSeasonEpisodes(raw)).toEqual([
      {
        number: 1,
        name: "",
        airDate: null,
        runtimeMinutes: null,
        stillPath: "/s.jpg",
        overview: "o",
      },
      {
        number: 2,
        name: "B",
        airDate: "2011-04-24",
        runtimeMinutes: 56,
        stillPath: null,
        overview: "",
      },
    ]);
  });

  it.each([
    [{ airDate: "2026-11-14" }, true],
    [{ airDate: "2026-11-15" }, true],
    [{ airDate: "2026-11-16" }, false],
    [{ airDate: null }, false],
  ])("hasAired(%j) on 2026-11-15 → %s", (episode, expected) => {
    expect(hasAired(episode, "2026-11-15")).toBe(expected);
  });

  it("todayIso returns YYYY-MM-DD", () => {
    expect(todayIso(new Date("2026-11-15T23:00:00Z"))).toBe("2026-11-15");
  });
});
