import { z } from "zod";
import { isValidRating, RATING_SCALE } from "@/shared/config/rating";
import { STORAGE_KEYS } from "@/shared/config/storage-keys";
import { mediaKeySchema } from "@/shared/lib/tmdb/schemas";
import { type MediaKey, type MediaSummary, MediaType } from "@/shared/lib/tmdb/types";

// ===================== Types =====================

export const WatchStatus = { ToWatch: "to_watch", Watched: "watched" } as const;
export type WatchStatus = (typeof WatchStatus)[keyof typeof WatchStatus];

export const WATCH_STATUSES: ReadonlyArray<WatchStatus> = Object.values(WatchStatus);

export const WATCH_STATUS_LABELS: Readonly<Record<WatchStatus, string>> = {
  [WatchStatus.ToWatch]: "Want to watch",
  [WatchStatus.Watched]: "Watched",
};

/**
 * The minimum card data kept with each entry, so the library pages render without calling TMDB.
 * Long or unused fields (overview, backdrop) are not stored: localStorage is small (~5 MB).
 */
export type MediaSnapshot = Omit<MediaSummary, "overview" | "backdropPath">;

export type LibraryEntry = {
  readonly media: MediaSnapshot;
  readonly isFavorite: boolean;
  readonly status: WatchStatus | null;
  /** Personal 1–10 rating (rating something marks it as watched). */
  readonly rating: number | null;
  /** Known when saved from a details page; feeds "time watched" in the stats. */
  readonly runtimeMinutes: number | null;
  /** Epoch ms. */
  readonly favoritedAt: number | null;
  readonly statusAt: number | null;
  readonly ratedAt: number | null;
  readonly updatedAt: number;
};

export type LibraryData = { readonly entries: Readonly<Record<MediaKey, LibraryEntry>> };

export const EMPTY_LIBRARY: LibraryData = { entries: {} };

/** Extra facts a caller may know (details page) but cards don't. */
export type MediaExtras = { readonly runtimeMinutes?: number | null };

// ===================== Persisted schema (+ migrations) =====================

export const LIBRARY_STORAGE_KEY = STORAGE_KEYS.library;
/** v1: favorites + status. v2: + personal rating, runtime. v3: slimmer snapshot (no overview/backdrop). */
export const LIBRARY_VERSION = 3;

const snapshotSchema = z.object({
  key: mediaKeySchema,
  id: z.number().int().positive(),
  mediaType: z.enum(MediaType),
  title: z.string(),
  posterPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  voteAverage: z.number(),
  voteCount: z.number(),
  genreIds: z.array(z.number()),
});

const entryV1Schema = z.object({
  media: snapshotSchema,
  isFavorite: z.boolean(),
  status: z.enum(WatchStatus).nullable(),
  favoritedAt: z.number().nullable(),
  statusAt: z.number().nullable(),
  updatedAt: z.number(),
});

const entrySchema = entryV1Schema.extend({
  rating: z.number().int().min(RATING_SCALE.min).max(RATING_SCALE.max).nullable(),
  runtimeMinutes: z.number().positive().nullable(),
  ratedAt: z.number().nullable(),
});

export const libraryDataSchema: z.ZodType<LibraryData> = z.object({
  entries: z.record(mediaKeySchema, entrySchema),
});

const libraryV1Schema = z.object({ entries: z.record(mediaKeySchema, entryV1Schema) });

/**
 * Persisted data from an older version → current shape. Unknown/invalid data returns
 * the empty library (and `validatedMerge` would reject it anyway).
 */
export const migrateLibrary = (persisted: unknown, fromVersion: number): LibraryData => {
  if (fromVersion >= LIBRARY_VERSION) return persisted as LibraryData;
  // v2 → v3 only dropped snapshot fields: zod strips unknown keys when the data is validated.
  if (fromVersion === 2) return persisted as LibraryData;
  const v1 = libraryV1Schema.safeParse(persisted);
  if (!v1.success) return EMPTY_LIBRARY;
  return {
    entries: Object.fromEntries(
      Object.entries(v1.data.entries).map(([key, entry]) => [
        key,
        { ...entry, rating: null, runtimeMinutes: null, ratedAt: null },
      ]),
    ),
  };
};

// ===================== Pure helpers =====================

/** Keeps only the summary fields, e.g. when called with the much larger details object. */
export const toMediaSnapshot = (media: MediaSummary): MediaSnapshot => ({
  key: media.key,
  id: media.id,
  mediaType: media.mediaType,
  title: media.title,
  posterPath: media.posterPath,
  releaseDate: media.releaseDate,
  voteAverage: media.voteAverage,
  voteCount: media.voteCount,
  genreIds: media.genreIds,
});

/** Snapshot → the summary shape cards take (fields that aren't stored are empty). */
export const snapshotToSummary = (snapshot: MediaSnapshot): MediaSummary => ({
  ...snapshot,
  overview: "",
  backdropPath: null,
});

const newEntry = (media: MediaSummary, now: number): LibraryEntry => ({
  media: toMediaSnapshot(media),
  isFavorite: false,
  status: null,
  rating: null,
  runtimeMinutes: null,
  favoritedAt: null,
  statusAt: null,
  ratedAt: null,
  updatedAt: now,
});

const isEmptyEntry = (entry: LibraryEntry): boolean =>
  !entry.isFavorite && entry.status === null && entry.rating === null;

const withoutKey = (data: LibraryData, key: MediaKey): LibraryData => {
  const { [key]: _removed, ...rest } = data.entries;
  return { entries: rest };
};

/** Applies `change` to the entry (creating it if needed); empty entries are dropped. */
const updateEntry = (
  data: LibraryData,
  media: MediaSummary,
  now: number,
  extras: MediaExtras,
  change: (entry: LibraryEntry) => LibraryEntry,
): LibraryData => {
  const current = data.entries[media.key] ?? newEntry(media, now);
  const next: LibraryEntry = {
    ...change(current),
    // Refresh the snapshot on every change so titles/posters stay current.
    media: toMediaSnapshot(media),
    runtimeMinutes: extras.runtimeMinutes ?? current.runtimeMinutes,
    updatedAt: now,
  };
  return isEmptyEntry(next)
    ? withoutKey(data, media.key)
    : { entries: { ...data.entries, [media.key]: next } };
};

// ===================== Reducers =====================

export const toggleFavorite = (
  data: LibraryData,
  media: MediaSummary,
  now: number,
  extras: MediaExtras = {},
): LibraryData =>
  updateEntry(data, media, now, extras, (entry) => ({
    ...entry,
    isFavorite: !entry.isFavorite,
    favoritedAt: entry.isFavorite ? null : now,
  }));

/** Selecting the current status again clears it (toggle behaviour). */
export const setWatchStatus = (
  data: LibraryData,
  media: MediaSummary,
  status: WatchStatus | null,
  now: number,
  extras: MediaExtras = {},
): LibraryData =>
  updateEntry(data, media, now, extras, (entry) => {
    const next = entry.status === status ? null : status;
    return { ...entry, status: next, statusAt: next === null ? null : now };
  });

/**
 * Personal rating. Rating a title also marks it as watched (you rate what you've seen);
 * `null` clears the rating but keeps the watch status.
 */
export const setRating = (
  data: LibraryData,
  media: MediaSummary,
  rating: number | null,
  now: number,
  extras: MediaExtras = {},
): LibraryData => {
  if (rating !== null && !isValidRating(rating)) return data;
  return updateEntry(data, media, now, extras, (entry) =>
    rating === null
      ? { ...entry, rating: null, ratedAt: null }
      : {
          ...entry,
          rating,
          ratedAt: now,
          status: WatchStatus.Watched,
          statusAt: entry.status === WatchStatus.Watched ? entry.statusAt : now,
        },
  );
};

export const removeFromLibrary = (data: LibraryData, key: MediaKey): LibraryData =>
  withoutKey(data, key);

// ===================== Selectors =====================

export const selectEntry = (data: LibraryData, key: MediaKey): LibraryEntry | null =>
  data.entries[key] ?? null;

const byNewest =
  (field: "favoritedAt" | "statusAt") =>
  (a: LibraryEntry, b: LibraryEntry): number =>
    (b[field] ?? 0) - (a[field] ?? 0);

export const selectFavorites = (data: LibraryData): ReadonlyArray<LibraryEntry> =>
  Object.values(data.entries)
    .filter((entry) => entry.isFavorite)
    .toSorted(byNewest("favoritedAt"));

export const selectByStatus = (
  data: LibraryData,
  status: WatchStatus,
): ReadonlyArray<LibraryEntry> =>
  Object.values(data.entries)
    .filter((entry) => entry.status === status)
    .toSorted(byNewest("statusAt"));

/** The favorite to base "Because you liked …" on: the most recently favorited one. */
export const selectLatestFavorite = (data: LibraryData): LibraryEntry | null =>
  selectFavorites(data)[0] ?? null;

export type LibraryCounts = Readonly<Record<"favorites" | WatchStatus, number>>;

export const selectCounts = (data: LibraryData): LibraryCounts => {
  const entries = Object.values(data.entries);
  const countStatus = (status: WatchStatus) =>
    entries.filter((entry) => entry.status === status).length;
  return {
    favorites: entries.filter((entry) => entry.isFavorite).length,
    [WatchStatus.ToWatch]: countStatus(WatchStatus.ToWatch),
    [WatchStatus.Watched]: countStatus(WatchStatus.Watched),
  };
};
