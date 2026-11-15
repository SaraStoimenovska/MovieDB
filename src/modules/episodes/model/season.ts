import { z } from "zod";
import { normalizeDate } from "@/shared/lib/tmdb/mappers";

export type Episode = {
  readonly number: number;
  readonly name: string;
  readonly airDate: string | null;
  readonly runtimeMinutes: number | null;
  readonly stillPath: string | null;
  readonly overview: string;
};

const episodeSchema = z.object({
  episode_number: z.number().int().positive(),
  name: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  air_date: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  runtime: z
    .number()
    .nullish()
    .transform((v) => (v && v > 0 ? v : null)),
  still_path: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  overview: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
});

const seasonSchema = z.object({ episodes: z.array(z.unknown()) });

/** TMDB `/tv/{id}/season/{n}` → episodes (invalid items skipped). */
export const parseSeasonEpisodes = (raw: unknown): ReadonlyArray<Episode> =>
  seasonSchema
    .parse(raw)
    .episodes.flatMap((item) => {
      const parsed = episodeSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    })
    .map((episode) => ({
      number: episode.episode_number,
      name: episode.name,
      airDate: normalizeDate(episode.air_date),
      runtimeMinutes: episode.runtime,
      stillPath: episode.still_path,
      overview: episode.overview,
    }))
    .toSorted((a, b) => a.number - b.number);

/** Unaired episodes can't be marked watched. `today` is an ISO date (YYYY-MM-DD). */
export const hasAired = (episode: Pick<Episode, "airDate">, today: string): boolean =>
  episode.airDate !== null && episode.airDate <= today;

export const todayIso = (now: Date = new Date()): string => now.toISOString().slice(0, 10);

export const seasonKeys = {
  season: (tvId: number, season: number) => ["episodes", "season", tvId, season] as const,
};
