/** Domain types: what the app works with, decoupled from TMDB's raw response shape. */

/**
 * Media type "enum": a const object + a union type of the same name (the TypeScript-recommended
 * alternative to `enum`: no runtime code beyond the object, works with isolatedModules).
 */
export const MediaType = { Movie: "movie", Tv: "tv" } as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const MEDIA_TYPES: ReadonlyArray<MediaType> = Object.values(MediaType);

export const MEDIA_TYPE_LABELS: Readonly<Record<MediaType, string>> = {
  [MediaType.Movie]: "Movie",
  [MediaType.Tv]: "Series",
};

export const MEDIA_TYPE_PLURAL_LABELS: Readonly<Record<MediaType, string>> = {
  [MediaType.Movie]: "Movies",
  [MediaType.Tv]: "Series",
};

export const isMediaType = (value: unknown): value is MediaType =>
  typeof value === "string" && (MEDIA_TYPES as ReadonlyArray<string>).includes(value);

/** Stable identifier across the app and localStorage, e.g. `movie:550`. */
export type MediaKey = `${MediaType}:${number}`;

export type MediaSummary = {
  readonly key: MediaKey;
  readonly id: number;
  readonly mediaType: MediaType;
  readonly title: string;
  readonly overview: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  /** ISO date `YYYY-MM-DD` or null when unknown. */
  readonly releaseDate: string | null;
  readonly voteAverage: number;
  readonly voteCount: number;
  readonly genreIds: ReadonlyArray<number>;
};

export type Paged<T> = {
  readonly page: number;
  readonly totalPages: number;
  readonly totalResults: number;
  readonly results: ReadonlyArray<T>;
};

export const toMediaKey = (mediaType: MediaType, id: number): MediaKey => `${mediaType}:${id}`;

const MEDIA_KEY_PATTERN = /^(movie|tv):\d+$/;

export const isMediaKey = (value: unknown): value is MediaKey =>
  typeof value === "string" && MEDIA_KEY_PATTERN.test(value);
