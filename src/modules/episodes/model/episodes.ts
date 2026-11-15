import { z } from "zod";
import { STORAGE_KEYS } from "@/shared/config/storage-keys";
import { mediaKeySchema } from "@/shared/lib/tmdb/schemas";
import { type MediaKey } from "@/shared/lib/tmdb/types";

export const EPISODES_STORAGE_KEY = STORAGE_KEYS.episodes;
export const EPISODES_VERSION = 1;

/** TMDB season 0 holds "Specials": shown, but not counted in progress or "Up next". */
export const SPECIALS_SEASON = 0;

// ===================== Types =====================

/** What we keep about the show, so "Up next" renders without calling TMDB. */
export type ShowRef = {
  readonly key: MediaKey;
  readonly id: number;
  readonly title: string;
  readonly posterPath: string | null;
};

export type SeasonInfo = {
  readonly number: number;
  readonly name: string;
  readonly episodeCount: number;
};

/** "2:5" = season 2, episode 5. */
export type EpisodeKey = `${number}:${number}`;

type WatchedEpisode = {
  readonly watchedAt: number;
  readonly runtimeMinutes: number | null;
};

export type ShowProgress = {
  readonly show: ShowRef;
  readonly seasons: ReadonlyArray<SeasonInfo>;
  readonly watched: Readonly<Record<EpisodeKey, WatchedEpisode>>;
  readonly updatedAt: number;
};

export type EpisodesData = { readonly shows: Readonly<Record<MediaKey, ShowProgress>> };

export const EMPTY_EPISODES: EpisodesData = { shows: {} };

export type EpisodeRef = { readonly season: number; readonly episode: number };

// ===================== Schema =====================

const episodeKeySchema = z.custom<EpisodeKey>(
  (value) => typeof value === "string" && /^\d+:\d+$/.test(value),
);

const progressSchema = z.object({
  show: z.object({
    key: mediaKeySchema,
    id: z.number().int().positive(),
    title: z.string(),
    posterPath: z.string().nullable(),
  }),
  seasons: z.array(
    z.object({
      number: z.number().int().min(0),
      name: z.string(),
      episodeCount: z.number().int().min(0),
    }),
  ),
  watched: z.record(
    episodeKeySchema,
    z.object({ watchedAt: z.number(), runtimeMinutes: z.number().positive().nullable() }),
  ),
  updatedAt: z.number(),
});

export const episodesDataSchema: z.ZodType<EpisodesData> = z.object({
  shows: z.record(mediaKeySchema, progressSchema),
});

// ===================== Helpers =====================

export const episodeKey = (season: number, episode: number): EpisodeKey => `${season}:${episode}`;

const regularSeasons = (seasons: ReadonlyArray<SeasonInfo>): ReadonlyArray<SeasonInfo> =>
  seasons
    .filter((season) => season.number !== SPECIALS_SEASON && season.episodeCount > 0)
    .toSorted((a, b) => a.number - b.number);

const withShow = (
  data: EpisodesData,
  show: ShowRef,
  seasons: ReadonlyArray<SeasonInfo>,
  watched: Readonly<Record<EpisodeKey, WatchedEpisode>>,
  now: number,
): EpisodesData => {
  if (Object.keys(watched).length === 0) {
    const { [show.key]: _removed, ...rest } = data.shows;
    return { shows: rest };
  }
  return { shows: { ...data.shows, [show.key]: { show, seasons, watched, updatedAt: now } } };
};

const watchedOf = (data: EpisodesData, key: MediaKey) => data.shows[key]?.watched ?? {};

// ===================== Reducers =====================

export const toggleEpisode = (
  data: EpisodesData,
  show: ShowRef,
  seasons: ReadonlyArray<SeasonInfo>,
  ref: EpisodeRef,
  runtimeMinutes: number | null,
  now: number,
): EpisodesData => {
  const key = episodeKey(ref.season, ref.episode);
  const { [key]: existing, ...others } = watchedOf(data, show.key);
  const watched = existing ? others : { ...others, [key]: { watchedAt: now, runtimeMinutes } };
  return withShow(data, show, seasons, watched, now);
};

/** Marks every given episode of a season watched (or un-watched). */
export const setSeasonWatched = (
  data: EpisodesData,
  show: ShowRef,
  seasons: ReadonlyArray<SeasonInfo>,
  season: number,
  episodes: ReadonlyArray<{ readonly number: number; readonly runtimeMinutes: number | null }>,
  watched: boolean,
  now: number,
): EpisodesData => {
  const current = watchedOf(data, show.key);
  const seasonKeys = new Set(episodes.map((episode) => episodeKey(season, episode.number)));
  const others = Object.fromEntries(
    Object.entries(current).filter(([key]) => !seasonKeys.has(key as EpisodeKey)),
  );
  const added = watched
    ? Object.fromEntries(
        episodes.map((episode) => [
          episodeKey(season, episode.number),
          current[episodeKey(season, episode.number)] ?? {
            watchedAt: now,
            runtimeMinutes: episode.runtimeMinutes,
          },
        ]),
      )
    : {};
  return withShow(data, show, seasons, { ...others, ...added }, now);
};

export const removeShow = (data: EpisodesData, key: MediaKey): EpisodesData => {
  const { [key]: _removed, ...rest } = data.shows;
  return { shows: rest };
};

// ===================== Selectors =====================

export const isEpisodeWatched = (progress: ShowProgress | null, ref: EpisodeRef): boolean =>
  Boolean(progress?.watched[episodeKey(ref.season, ref.episode)]);

export const watchedInSeason = (progress: ShowProgress | null, season: number): number =>
  progress ? Object.keys(progress.watched).filter((key) => key.startsWith(`${season}:`)).length : 0;

export type ProgressSummary = {
  readonly watched: number;
  readonly total: number;
  /** 0–100, rounded. */
  readonly percent: number;
};

/** Progress over regular seasons only (specials excluded from both sides). */
export const progressSummary = (progress: ShowProgress | null): ProgressSummary => {
  if (!progress) return { watched: 0, total: 0, percent: 0 };
  const seasons = regularSeasons(progress.seasons);
  const total = seasons.reduce((sum, season) => sum + season.episodeCount, 0);
  const watched = seasons.reduce(
    (sum, season) => sum + watchedInSeason(progress, season.number),
    0,
  );
  return { watched, total, percent: total === 0 ? 0 : Math.round((watched / total) * 100) };
};

/** First regular-season episode not yet watched, in order; null when everything is watched. */
export const nextEpisode = (progress: ShowProgress): EpisodeRef | null =>
  regularSeasons(progress.seasons)
    .flatMap((season) =>
      Array.from({ length: season.episodeCount }, (_, index) => ({
        season: season.number,
        episode: index + 1,
      })),
    )
    .find((ref) => !isEpisodeWatched(progress, ref)) ?? null;

export type UpNextItem = { readonly progress: ShowProgress; readonly next: EpisodeRef };

/** Shows you've started and not finished, most recently watched first. */
export const selectUpNext = (data: EpisodesData): ReadonlyArray<UpNextItem> =>
  Object.values(data.shows)
    .map((progress) => ({ progress, next: nextEpisode(progress) }))
    .filter((item): item is UpNextItem => item.next !== null)
    .toSorted((a, b) => b.progress.updatedAt - a.progress.updatedAt);

export type EpisodeTotals = { readonly episodes: number; readonly minutes: number };

export const selectEpisodeTotals = (data: EpisodesData): EpisodeTotals =>
  Object.values(data.shows)
    .flatMap((progress) => Object.values(progress.watched))
    .reduce<EpisodeTotals>(
      (totals, episode) => ({
        episodes: totals.episodes + 1,
        minutes: totals.minutes + (episode.runtimeMinutes ?? 0),
      }),
      { episodes: 0, minutes: 0 },
    );

/** "S2 E5". */
export const formatEpisodeRef = (ref: EpisodeRef): string => `S${ref.season} E${ref.episode}`;
