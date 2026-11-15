import { describe, expect, it } from "vitest";
import { type MediaKey, MediaType } from "@/shared/lib/tmdb/types";
import {
  addDays,
  daysBetween,
  episodeItems,
  groupUpcoming,
  type ListedTitle,
  MAX_SHOWS_CHECKED,
  parseNextEpisode,
  releaseItems,
  showsToCheck,
  toIsoDay,
  UpcomingGroup,
  UpcomingKind,
  type UpcomingMedia,
} from "./upcoming";

const TODAY = "2026-11-15";

const media = (id: number, mediaType: MediaType = MediaType.Movie): UpcomingMedia => ({
  key: `${mediaType}:${id}` as MediaKey,
  id,
  mediaType,
  title: `Title ${id}`,
  posterPath: null,
});

const listed = (
  id: number,
  releaseDate: string | null,
  extra: Partial<ListedTitle> & { readonly mediaType?: MediaType } = {},
): ListedTitle => ({
  media: { ...media(id, extra.mediaType), releaseDate },
  watched: extra.watched ?? false,
  updatedAt: extra.updatedAt ?? id,
});

describe("dates", () => {
  it("toIsoDay uses the local calendar date", () => {
    expect(toIsoDay(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it("addDays and daysBetween handle month/year ends", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(daysBetween(TODAY, TODAY)).toBe(0);
  });
});

describe("parseNextEpisode", () => {
  it("reads TMDB's next_episode_to_air", () => {
    expect(
      parseNextEpisode({
        next_episode_to_air: {
          air_date: "2026-11-20",
          season_number: 2,
          episode_number: 5,
          name: null,
        },
      }),
    ).toEqual({ airDate: "2026-11-20", season: 2, episode: 5, name: "" });
  });

  it("is null for ended shows, missing dates and junk", () => {
    expect(parseNextEpisode({ next_episode_to_air: null })).toBeNull();
    expect(parseNextEpisode({})).toBeNull();
    expect(
      parseNextEpisode({
        next_episode_to_air: { air_date: "", season_number: 1, episode_number: 1 },
      }),
    ).toBeNull();
    expect(parseNextEpisode("junk")).toBeNull();
  });
});

describe("releaseItems", () => {
  it("keeps unwatched titles releasing after today", () => {
    const items = releaseItems(
      [
        listed(1, "2026-12-01"),
        listed(2, "2026-11-15"), // today: already out
        listed(3, "2027-01-01", { watched: true }),
        listed(4, null),
        listed(5, "2027-03-01", { mediaType: MediaType.Tv }),
      ],
      TODAY,
    );
    expect(items.map((item) => [item.media.id, item.kind, item.date])).toEqual([
      [1, UpcomingKind.MovieRelease, "2026-12-01"],
      [5, UpcomingKind.SeriesPremiere, "2027-03-01"],
    ]);
  });
});

describe("showsToCheck", () => {
  it("merges listed and tracked series without duplicates, newest first", () => {
    const shows = showsToCheck(
      [
        listed(10, null, { mediaType: MediaType.Tv, updatedAt: 5 }),
        listed(11, null), // a movie: not checked
      ],
      [
        { media: media(10, MediaType.Tv), updatedAt: 9 },
        { media: media(12, MediaType.Tv), updatedAt: 1 },
      ],
    );
    expect(shows.map((show) => show.id)).toEqual([10, 12]);
  });

  it(`checks at most ${MAX_SHOWS_CHECKED} series`, () => {
    const tracked = Array.from({ length: MAX_SHOWS_CHECKED + 5 }, (_, index) => ({
      media: media(100 + index, MediaType.Tv),
      updatedAt: index,
    }));
    expect(showsToCheck([], tracked)).toHaveLength(MAX_SHOWS_CHECKED);
  });
});

describe("episodeItems", () => {
  it("keeps episodes airing today or later", () => {
    const next = (airDate: string) => ({ airDate, season: 1, episode: 2, name: "Ep" });
    const items = episodeItems(
      [
        { media: media(1, MediaType.Tv), next: next("2026-11-15") },
        { media: media(2, MediaType.Tv), next: next("2026-11-14") },
        { media: media(3, MediaType.Tv), next: null },
      ],
      TODAY,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: UpcomingKind.Episode, date: TODAY });
  });
});

describe("groupUpcoming", () => {
  const item = (id: number, date: string) => ({
    kind: UpcomingKind.MovieRelease,
    date,
    media: media(id),
    episode: null,
  });

  it("sorts soonest first into this week / this month / later, dropping empty groups", () => {
    const sections = groupUpcoming(
      [
        item(1, "2027-02-01"),
        item(2, "2026-11-21"), // +6 days: this week
        item(3, "2026-11-15"),
        item(4, "2026-11-22"), // +7 days: this month
        item(5, "2026-11-10"), // past: dropped
      ],
      TODAY,
    );
    expect(sections.map((s) => [s.group, s.items.map((i) => i.media.id)])).toEqual([
      [UpcomingGroup.ThisWeek, [3, 2]],
      [UpcomingGroup.ThisMonth, [4]],
      [UpcomingGroup.Later, [1]],
    ]);
    expect(groupUpcoming([], TODAY)).toEqual([]);
  });
});
