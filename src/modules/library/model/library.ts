import { z } from "zod";
import { type MediaKey, type MediaSummary } from "@/shared/lib/tmdb/types";

// ===================== Types =====================

export const WATCH_STATUSES = ["to_watch", "watched"] as const;
export type WatchStatus = (typeof WATCH_STATUSES)[number];

export const WATCH_STATUS_LABELS: Readonly<Record<WatchStatus, string>> = {
  to_watch: "Want to watch",
  watched: "Watched",
};

/** Card data kept with the entry, so the library pages render without calling TMDB. */
export type MediaSnapshot = MediaSummary;

export type LibraryEntry = {
  readonly media: MediaSnapshot;
  readonly isFavorite: boolean;
  readonly status: WatchStatus | null;
  /** Epoch ms. */
  readonly favoritedAt: number | null;
  readonly statusAt: number | null;
  readonly updatedAt: number;
};

export type LibraryData = { readonly entries: Readonly<Record<MediaKey, LibraryEntry>> };

export const EMPTY_LIBRARY: LibraryData = { entries: {} };

// ===================== Persisted schema =====================

export const LIBRARY_STORAGE_KEY = "mdb:library";
export const LIBRARY_VERSION = 1;

const mediaKeySchema = z.custom<MediaKey>(
  (value) => typeof value === "string" && /^(movie|tv):\d+$/.test(value),
);

const snapshotSchema = z.object({
  key: mediaKeySchema,
  id: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  overview: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  voteAverage: z.number(),
  voteCount: z.number(),
  genreIds: z.array(z.number()),
});

const entrySchema = z.object({
  media: snapshotSchema,
  isFavorite: z.boolean(),
  status: z.enum(WATCH_STATUSES).nullable(),
  favoritedAt: z.number().nullable(),
  statusAt: z.number().nullable(),
  updatedAt: z.number(),
});

export const libraryDataSchema: z.ZodType<LibraryData> = z.object({
  entries: z.record(mediaKeySchema, entrySchema),
});

// ===================== Pure helpers =====================

/** Keeps only the summary fields, e.g. when called with the much larger details object. */
export const toMediaSnapshot = (media: MediaSummary): MediaSnapshot => ({
  key: media.key,
  id: media.id,
  mediaType: media.mediaType,
  title: media.title,
  overview: media.overview.slice(0, 500),
  posterPath: media.posterPath,
  backdropPath: media.backdropPath,
  releaseDate: media.releaseDate,
  voteAverage: media.voteAverage,
  voteCount: media.voteCount,
  genreIds: media.genreIds,
});

const newEntry = (media: MediaSummary, now: number): LibraryEntry => ({
  media: toMediaSnapshot(media),
  isFavorite: false,
  status: null,
  favoritedAt: null,
  statusAt: null,
  updatedAt: now,
});

const isEmptyEntry = (entry: LibraryEntry): boolean => !entry.isFavorite && entry.status === null;

const withoutKey = (data: LibraryData, key: MediaKey): LibraryData => {
  const { [key]: _removed, ...rest } = data.entries;
  return { entries: rest };
};

/** Applies `change` to the entry (creating it if needed); empty entries are dropped. */
const updateEntry = (
  data: LibraryData,
  media: MediaSummary,
  now: number,
  change: (entry: LibraryEntry) => LibraryEntry,
): LibraryData => {
  const current = data.entries[media.key] ?? newEntry(media, now);
  // Refresh the snapshot on every change so titles/posters stay current.
  const next = { ...change(current), media: toMediaSnapshot(media), updatedAt: now };
  return isEmptyEntry(next)
    ? withoutKey(data, media.key)
    : { entries: { ...data.entries, [media.key]: next } };
};

// ===================== Reducers =====================

export const toggleFavorite = (data: LibraryData, media: MediaSummary, now: number): LibraryData =>
  updateEntry(data, media, now, (entry) => ({
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
): LibraryData =>
  updateEntry(data, media, now, (entry) => {
    const next = entry.status === status ? null : status;
    return { ...entry, status: next, statusAt: next === null ? null : now };
  });

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

export type LibraryCounts = Readonly<Record<"favorites" | WatchStatus, number>>;

export const selectCounts = (data: LibraryData): LibraryCounts =>
  Object.values(data.entries).reduce<LibraryCounts>(
    (counts, entry) => ({
      favorites: counts.favorites + (entry.isFavorite ? 1 : 0),
      to_watch: counts.to_watch + (entry.status === "to_watch" ? 1 : 0),
      watched: counts.watched + (entry.status === "watched" ? 1 : 0),
    }),
    { favorites: 0, to_watch: 0, watched: 0 },
  );
