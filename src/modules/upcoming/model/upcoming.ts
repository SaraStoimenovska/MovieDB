import { z } from "zod";
import { type MediaKey, MediaType } from "@/shared/lib/tmdb/types";

// ===================== Types =====================

export const UpcomingKind = {
  /** A movie on your list that isn't out yet. */
  MovieRelease: "movie-release",
  /** A series on your list that hasn't premiered yet. */
  SeriesPremiere: "series-premiere",
  /** The next episode of a series you follow. */
  Episode: "episode",
} as const;
export type UpcomingKind = (typeof UpcomingKind)[keyof typeof UpcomingKind];

export const UPCOMING_KIND_LABELS: Readonly<Record<UpcomingKind, string>> = {
  [UpcomingKind.MovieRelease]: "Release",
  [UpcomingKind.SeriesPremiere]: "Series premiere",
  [UpcomingKind.Episode]: "New episode",
};

/** The bits of a title the Upcoming page shows. */
export type UpcomingMedia = {
  readonly key: MediaKey;
  readonly id: number;
  readonly mediaType: MediaType;
  readonly title: string;
  readonly posterPath: string | null;
};

export type NextEpisode = {
  /** YYYY-MM-DD */
  readonly airDate: string;
  readonly season: number;
  readonly episode: number;
  readonly name: string;
};

export type UpcomingItem = {
  readonly kind: UpcomingKind;
  /** YYYY-MM-DD */
  readonly date: string;
  readonly media: UpcomingMedia;
  /** Only for `Episode`. */
  readonly episode: NextEpisode | null;
};

/** Library entry fields this module needs (kept structural: no dependency on its full type). */
export type ListedTitle = {
  readonly media: UpcomingMedia & { readonly releaseDate: string | null };
  readonly watched: boolean;
  /** For picking which shows to check first (epoch ms). */
  readonly updatedAt: number;
};

/** Series fetched for their next episode at most (one request each). */
export const MAX_SHOWS_CHECKED = 40;

// ===================== Dates (YYYY-MM-DD, local calendar) =====================

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The local calendar date of `now` as YYYY-MM-DD (not UTC: "today" is the user's today). */
export const toIsoDay = (now: Date): string =>
  [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
    .join("-");

export const addDays = (isoDay: string, days: number): string => {
  const [year = 0, month = 1, day = 1] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

// ===================== TMDB parsing =====================

const nextEpisodeSchema = z.object({
  next_episode_to_air: z
    .object({
      air_date: z.string().regex(ISO_DATE),
      season_number: z.number(),
      episode_number: z.number(),
      name: z
        .string()
        .nullish()
        .transform((value) => value ?? ""),
    })
    .nullish(),
});

/** TMDB `tv/{id}` → its next episode, or `null` (ended, no date yet, or unexpected shape). */
export const parseNextEpisode = (raw: unknown): NextEpisode | null => {
  const parsed = nextEpisodeSchema.safeParse(raw);
  const next = parsed.success ? parsed.data.next_episode_to_air : null;
  return next
    ? {
        airDate: next.air_date,
        season: next.season_number,
        episode: next.episode_number,
        name: next.name,
      }
    : null;
};

// ===================== Building the list =====================

/** Unreleased movies / not-yet-premiered series on your list (watched ones are skipped). */
export const releaseItems = (
  titles: ReadonlyArray<ListedTitle>,
  today: string,
): ReadonlyArray<UpcomingItem> =>
  titles
    .filter((title) => !title.watched)
    .filter((title) => title.media.releaseDate !== null && ISO_DATE.test(title.media.releaseDate))
    .filter((title) => (title.media.releaseDate ?? "") > today)
    .map((title) => ({
      kind:
        title.media.mediaType === MediaType.Movie
          ? UpcomingKind.MovieRelease
          : UpcomingKind.SeriesPremiere,
      date: title.media.releaseDate ?? today,
      media: pickMedia(title.media),
      episode: null,
    }));

const pickMedia = (media: UpcomingMedia): UpcomingMedia => ({
  key: media.key,
  id: media.id,
  mediaType: media.mediaType,
  title: media.title,
  posterPath: media.posterPath,
});

/**
 * Series to check for a next episode: series on your list plus series you track episodes of,
 * without duplicates, most recently touched first, capped at `MAX_SHOWS_CHECKED`.
 */
export const showsToCheck = (
  titles: ReadonlyArray<ListedTitle>,
  tracked: ReadonlyArray<{ readonly media: UpcomingMedia; readonly updatedAt: number }>,
): ReadonlyArray<UpcomingMedia> => {
  const candidates = [
    ...titles.filter((title) => title.media.mediaType === MediaType.Tv),
    ...tracked,
  ].toSorted((a, b) => b.updatedAt - a.updatedAt);
  const unique = candidates.filter(
    (candidate, index) =>
      candidates.findIndex((other) => other.media.key === candidate.media.key) === index,
  );
  return unique.slice(0, MAX_SHOWS_CHECKED).map((candidate) => pickMedia(candidate.media));
};

/** Next episodes that air today or later. */
export const episodeItems = (
  shows: ReadonlyArray<{ readonly media: UpcomingMedia; readonly next: NextEpisode | null }>,
  today: string,
): ReadonlyArray<UpcomingItem> =>
  shows.flatMap(({ media, next }) =>
    next && next.airDate >= today
      ? [{ kind: UpcomingKind.Episode, date: next.airDate, media, episode: next }]
      : [],
  );

// ===================== Grouping =====================

export const UpcomingGroup = {
  ThisWeek: "this-week",
  ThisMonth: "this-month",
  Later: "later",
} as const;
export type UpcomingGroup = (typeof UpcomingGroup)[keyof typeof UpcomingGroup];

export const UPCOMING_GROUP_LABELS: Readonly<Record<UpcomingGroup, string>> = {
  [UpcomingGroup.ThisWeek]: "This week",
  [UpcomingGroup.ThisMonth]: "This month",
  [UpcomingGroup.Later]: "Later",
};

/** "This week" = the next 7 days (today included), "This month" = the next 30. */
const GROUP_LIMIT_DAYS = { [UpcomingGroup.ThisWeek]: 6, [UpcomingGroup.ThisMonth]: 30 } as const;

const groupOf = (date: string, today: string): UpcomingGroup => {
  const days = daysBetween(today, date);
  return days <= GROUP_LIMIT_DAYS[UpcomingGroup.ThisWeek]
    ? UpcomingGroup.ThisWeek
    : days <= GROUP_LIMIT_DAYS[UpcomingGroup.ThisMonth]
      ? UpcomingGroup.ThisMonth
      : UpcomingGroup.Later;
};

export type UpcomingSection = {
  readonly group: UpcomingGroup;
  readonly items: ReadonlyArray<UpcomingItem>;
};

/** Pure: soonest first, split into non-empty groups (in group order). */
export const groupUpcoming = (
  items: ReadonlyArray<UpcomingItem>,
  today: string,
): ReadonlyArray<UpcomingSection> => {
  const sorted = items
    .filter((item) => item.date >= today)
    .toSorted((a, b) => a.date.localeCompare(b.date) || a.media.title.localeCompare(b.media.title));
  return Object.values(UpcomingGroup)
    .map((group) => ({
      group,
      items: sorted.filter((item) => groupOf(item.date, today) === group),
    }))
    .filter((section) => section.items.length > 0);
};
