import { z } from "zod";
import { mapMultiItem, normalizeDate } from "@/shared/lib/tmdb/mappers";
import { TmdbMediaType, tmdbMovieSchema, tmdbTvSchema } from "@/shared/lib/tmdb/schemas";
import { type MediaSummary } from "@/shared/lib/tmdb/types";

// ===================== Domain =====================

export type Credit = {
  readonly media: MediaSummary;
  /** Character(s) for acting, job(s) for crew, e.g. "Tyler Durden" or "Director, Writer". */
  readonly role: string;
};

export type PersonDetails = {
  readonly id: number;
  readonly name: string;
  readonly biography: string;
  readonly knownForDepartment: string | null;
  readonly birthday: string | null;
  readonly deathday: string | null;
  readonly placeOfBirth: string | null;
  readonly profilePath: string | null;
  readonly imdbId: string | null;
  readonly homepage: string | null;
  readonly knownFor: ReadonlyArray<MediaSummary>;
  readonly acting: ReadonlyArray<Credit>;
  readonly crew: ReadonlyArray<Credit>;
};

/** TMDB genres for talk shows and news: guest appearances there aren't filmography. */
const NON_FILMOGRAPHY_GENRES: ReadonlySet<number> = new Set([10767, 10763]);

const LIMITS = { knownFor: 12, credits: 150 } as const;

/** The department whose credits feed "Known for" (actors → acting, directors → crew). */
const ACTING_DEPARTMENT = "Acting";

// ===================== Raw schemas =====================

const emptyToNull = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null));

const roleFields = {
  character: z.string().nullish(),
  job: z.string().nullish(),
};

const creditSchema = z.discriminatedUnion("media_type", [
  tmdbMovieSchema.extend({ media_type: z.literal(TmdbMediaType.Movie), ...roleFields }),
  tmdbTvSchema.extend({ media_type: z.literal(TmdbMediaType.Tv), ...roleFields }),
]);

type RawCredit = z.infer<typeof creditSchema>;

const creditList = z
  .array(z.unknown())
  .nullish()
  .transform((items) =>
    (items ?? []).flatMap((item) => {
      const parsed = creditSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    }),
  );

const tmdbPersonSchema = z.object({
  id: z.number(),
  name: z.string(),
  biography: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  known_for_department: emptyToNull,
  birthday: emptyToNull,
  deathday: emptyToNull,
  place_of_birth: emptyToNull,
  profile_path: emptyToNull,
  imdb_id: emptyToNull,
  homepage: emptyToNull,
  combined_credits: z
    .object({ cast: creditList, crew: creditList })
    .nullish()
    .transform((v) => v ?? { cast: [], crew: [] }),
});

// ===================== Pure helpers =====================

const isFilmography = (credit: RawCredit): boolean =>
  !credit.genre_ids.some((genre) => NON_FILMOGRAPHY_GENRES.has(genre));

const roleOf = (credit: RawCredit): string => credit.character || credit.job || "";

/**
 * One row per title: TMDB lists a series once per character/job, so roles are merged
 * ("Director, Writer"). Newest first; undated (announced) titles go on top.
 */
export const mergeCredits = (credits: ReadonlyArray<RawCredit>): ReadonlyArray<Credit> => {
  const grouped = Map.groupBy(
    credits.filter(isFilmography),
    (credit) => `${credit.media_type}:${credit.id}`,
  );
  return [...grouped.values()]
    .flatMap((group): ReadonlyArray<Credit> => {
      const [first] = group;
      const media = first ? mapMultiItem(first) : null;
      if (!media) return [];
      const roles = [...new Set(group.map(roleOf).filter(Boolean))];
      return [{ media, role: roles.join(", ") }];
    })
    .toSorted((a, b) =>
      (b.media.releaseDate ?? UNDATED_SORT_KEY).localeCompare(
        a.media.releaseDate ?? UNDATED_SORT_KEY,
      ),
    )
    .slice(0, LIMITS.credits);
};

/** Most-voted titles first: the ones people actually know. */
const pickKnownFor = (credits: ReadonlyArray<Credit>): ReadonlyArray<MediaSummary> =>
  credits
    .map((credit) => credit.media)
    .filter((media, index, all) => all.findIndex((m) => m.key === media.key) === index)
    .toSorted((a, b) => b.voteCount - a.voteCount)
    .slice(0, LIMITS.knownFor);

/** Age in whole years at `on` (today, or the day they died). */
export const ageInYears = (birthday: string, on: Date): number | null => {
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  const hadBirthday =
    on.getUTCMonth() > birth.getUTCMonth() ||
    (on.getUTCMonth() === birth.getUTCMonth() && on.getUTCDate() >= birth.getUTCDate());
  return on.getUTCFullYear() - birth.getUTCFullYear() - (hadBirthday ? 0 : 1);
};

export const parsePerson = (raw: unknown): PersonDetails => {
  const person = tmdbPersonSchema.parse(raw);
  const acting = mergeCredits(person.combined_credits.cast);
  const crew = mergeCredits(person.combined_credits.crew);
  const primary =
    defaultCreditTab({ knownForDepartment: person.known_for_department, crew }) === CreditTab.Acting
      ? acting
      : crew;

  return {
    id: person.id,
    name: person.name,
    biography: person.biography,
    knownForDepartment: person.known_for_department,
    birthday: normalizeDate(person.birthday),
    deathday: normalizeDate(person.deathday),
    placeOfBirth: person.place_of_birth,
    profilePath: person.profile_path,
    imdbId: person.imdb_id,
    homepage: person.homepage,
    knownFor: pickKnownFor(primary),
    acting,
    crew,
  };
};

export const CreditTab = { Acting: "acting", Crew: "crew" } as const;
export type CreditTab = (typeof CreditTab)[keyof typeof CreditTab];

export const isCreditTab = (value: string): value is CreditTab =>
  value === CreditTab.Acting || value === CreditTab.Crew;

/** Actors open on Acting; directors, writers… open on Crew. */
export const defaultCreditTab = (
  person: Pick<PersonDetails, "knownForDepartment" | "crew">,
): CreditTab =>
  person.knownForDepartment === ACTING_DEPARTMENT || person.crew.length === 0
    ? CreditTab.Acting
    : CreditTab.Crew;

/** Sort key that puts undated (announced) titles first in a newest-first list. */
const UNDATED_SORT_KEY = "9999";
