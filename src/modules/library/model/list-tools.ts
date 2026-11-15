import { type MediaType } from "@/shared/lib/tmdb/types";
import { type LibraryEntry } from "./library";

// ===================== Options =====================

export const LibrarySort = {
  Added: "added",
  Title: "title",
  Release: "release",
  MyRating: "my-rating",
  TmdbRating: "tmdb-rating",
} as const;
export type LibrarySort = (typeof LibrarySort)[keyof typeof LibrarySort];

export const LIBRARY_SORTS: ReadonlyArray<LibrarySort> = Object.values(LibrarySort);

export const LIBRARY_SORT_LABELS: Readonly<Record<LibrarySort, string>> = {
  [LibrarySort.Added]: "Recently added",
  [LibrarySort.Title]: "Title (A–Z)",
  [LibrarySort.Release]: "Release date (newest)",
  [LibrarySort.MyRating]: "Your rating",
  [LibrarySort.TmdbRating]: "TMDB rating",
};

/** "all" or one media type. */
export const ALL_TYPES = "all";
export type TypeFilter = typeof ALL_TYPES | MediaType;

export type ListQuery = {
  readonly sort: LibrarySort;
  readonly type: TypeFilter;
  /** `null` = every genre. */
  readonly genreId: number | null;
};

export const DEFAULT_LIST_QUERY: ListQuery = {
  sort: LibrarySort.Added,
  type: ALL_TYPES,
  genreId: null,
};

export const isLibrarySort = (value: string): value is LibrarySort =>
  (LIBRARY_SORTS as ReadonlyArray<string>).includes(value);

export const isDefaultQuery = (query: ListQuery): boolean =>
  query.type === DEFAULT_LIST_QUERY.type && query.genreId === DEFAULT_LIST_QUERY.genreId;

// ===================== Filtering & sorting =====================

/** When an entry was added to the list being shown (favorited / given its status). */
export type AddedAt = (entry: LibraryEntry) => number | null;

const matches = (entry: LibraryEntry, query: ListQuery): boolean =>
  (query.type === ALL_TYPES || entry.media.mediaType === query.type) &&
  (query.genreId === null || entry.media.genreIds.includes(query.genreId));

/** Missing values always sort last, whatever the direction. */
const descending = (a: number | null, b: number | null): number =>
  a === null && b === null ? 0 : a === null ? 1 : b === null ? -1 : b - a;

const releaseTime = (entry: LibraryEntry): number | null => {
  const time = entry.media.releaseDate ? Date.parse(entry.media.releaseDate) : Number.NaN;
  return Number.isNaN(time) ? null : time;
};

const comparator = (
  sort: LibrarySort,
  addedAt: AddedAt,
  locale: string,
): ((a: LibraryEntry, b: LibraryEntry) => number) => {
  switch (sort) {
    case LibrarySort.Added:
      return (a, b) => descending(addedAt(a), addedAt(b));
    case LibrarySort.Title:
      return (a, b) => a.media.title.localeCompare(b.media.title, locale, { sensitivity: "base" });
    case LibrarySort.Release:
      return (a, b) => descending(releaseTime(a), releaseTime(b));
    case LibrarySort.MyRating:
      return (a, b) => descending(a.rating, b.rating) || descending(addedAt(a), addedAt(b));
    case LibrarySort.TmdbRating:
      return (a, b) =>
        descending(
          a.media.voteCount > 0 ? a.media.voteAverage : null,
          b.media.voteCount > 0 ? b.media.voteAverage : null,
        );
  }
};

/** Pure: the entries matching the filters, in the requested order. */
export const applyListQuery = (
  entries: ReadonlyArray<LibraryEntry>,
  query: ListQuery,
  addedAt: AddedAt,
  locale: string,
): ReadonlyArray<LibraryEntry> =>
  entries
    .filter((entry) => matches(entry, query))
    .toSorted(comparator(query.sort, addedAt, locale));

export type GenreOption = { readonly id: number; readonly name: string; readonly count: number };

/**
 * Genres present in these entries (for the filter), most common first. Only genres with a known
 * name are offered; the type filter applies so the counts match what selecting would show.
 */
export const genreOptions = (
  entries: ReadonlyArray<LibraryEntry>,
  type: TypeFilter,
  genreNames: Readonly<Record<number, string>>,
): ReadonlyArray<GenreOption> => {
  const counts = entries
    .filter((entry) => type === ALL_TYPES || entry.media.mediaType === type)
    .flatMap((entry) => entry.media.genreIds)
    .reduce<Readonly<Record<number, number>>>(
      (acc, id) => ({ ...acc, [id]: (acc[id] ?? 0) + 1 }),
      {},
    );
  return Object.entries(counts)
    .map(([id, count]) => ({ id: Number(id), name: genreNames[Number(id)] ?? "", count }))
    .filter((option) => option.name !== "")
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};
