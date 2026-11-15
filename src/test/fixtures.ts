import { type MediaSummary, MediaType, toMediaKey } from "@/shared/lib/tmdb/types";

/** Domain-level media for component/store tests. */
export const makeMedia = (overrides: Partial<MediaSummary> = {}): MediaSummary => {
  const mediaType = overrides.mediaType ?? MediaType.Movie;
  const id = overrides.id ?? 550;
  return {
    key: toMediaKey(mediaType, id),
    id,
    mediaType,
    title: "Fight Club",
    overview: "An insomniac office worker forms an underground fight club.",
    posterPath: "/poster.jpg",
    backdropPath: "/backdrop.jpg",
    releaseDate: "1999-10-15",
    voteAverage: 8.4,
    voteCount: 30000,
    genreIds: [18],
    ...overrides,
  };
};

/** Raw TMDB list item (as returned by discover/trending). */
export const rawMovie = (overrides: Record<string, unknown> = {}) => ({
  id: 550,
  title: "Fight Club",
  overview: "An insomniac office worker…",
  poster_path: "/poster.jpg",
  backdrop_path: "/backdrop.jpg",
  release_date: "1999-10-15",
  vote_average: 8.4,
  vote_count: 30000,
  genre_ids: [18],
  ...overrides,
});

export const rawTv = (overrides: Record<string, unknown> = {}) => ({
  id: 1399,
  name: "Game of Thrones",
  overview: "Nine noble families fight for control.",
  poster_path: "/got.jpg",
  backdrop_path: "/got-bd.jpg",
  first_air_date: "2011-04-17",
  vote_average: 8.5,
  vote_count: 25000,
  genre_ids: [10765],
  ...overrides,
});

export const rawPage = (results: ReadonlyArray<unknown>, page = 1, totalPages = 3) => ({
  page,
  total_pages: totalPages,
  total_results: totalPages * 20,
  results,
});

/** Deep-freezes test inputs so any accidental mutation in a reducer throws. */
export const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};
