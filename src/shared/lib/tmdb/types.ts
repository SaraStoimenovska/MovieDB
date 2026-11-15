/** Domain types: what the app works with, decoupled from TMDB's raw response shape. */

export type MediaType = "movie" | "tv";

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
