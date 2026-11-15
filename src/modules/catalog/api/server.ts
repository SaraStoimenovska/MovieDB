import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { CACHE_LIFE, CacheTag } from "@/shared/config/cache";
import { HttpStatus } from "@/shared/config/http";
import { isTmdbRequestError, tmdbGet } from "@/shared/lib/tmdb/client";
import { APP_REGION } from "@/shared/config/app";
import { PAGE_PARSERS, parseMoviePage, parseMultiPage } from "@/shared/lib/tmdb/mappers";
import { type MediaSummary, MediaType, type Paged } from "@/shared/lib/tmdb/types";
import { type CatalogFilters, toDiscoverParams } from "../model/filters";
import { type Genre, parseGenreList } from "../model/genres";

/** Trending endpoint scope: one media type, or both mixed. */
export const TrendingScope = { All: "all", Movie: "movie", Tv: "tv" } as const;
export type TrendingScope = (typeof TrendingScope)[keyof typeof TrendingScope];

export const TrendingWindow = { Day: "day", Week: "week" } as const;
export type TrendingWindow = (typeof TrendingWindow)[keyof typeof TrendingWindow];

const TRENDING_PARSERS: Readonly<Record<TrendingScope, (raw: unknown) => Paged<MediaSummary>>> = {
  ...PAGE_PARSERS,
  [TrendingScope.All]: parseMultiPage,
};

export async function getTrending(
  scope: TrendingScope,
  window: TrendingWindow = TrendingWindow.Week,
): Promise<ReadonlyArray<MediaSummary>> {
  "use cache";
  cacheLife(CACHE_LIFE.trending);
  cacheTag(CacheTag.Tmdb, CacheTag.trending(scope, window));

  const raw = await tmdbGet(`trending/${scope}/${window}`);
  return TRENDING_PARSERS[scope](raw).results;
}

export async function getGenres(mediaType: MediaType): Promise<ReadonlyArray<Genre>> {
  "use cache";
  cacheLife(CACHE_LIFE.genres);
  cacheTag(CacheTag.Tmdb, CacheTag.genres(mediaType));

  return parseGenreList(await tmdbGet(`genre/${mediaType}/list`));
}

/** Genre id → name for movies and series together (ids don't collide across types). */
export async function genreNameMap(): Promise<Readonly<Record<number, string>>> {
  const [movie, tv] = await Promise.all([getGenres(MediaType.Movie), getGenres(MediaType.Tv)]);
  return Object.fromEntries([...movie, ...tv].map((genre) => [genre.id, genre.name]));
}

/** Curated TMDB movie lists shown as home rows. */
export const MovieList = { NowPlaying: "now_playing", Upcoming: "upcoming" } as const;
export type MovieList = (typeof MovieList)[keyof typeof MovieList];

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * "In theaters" / "Coming soon" for the app region. TMDB's upcoming list also contains titles
 * that already premiered somewhere, so it's filtered to future release dates.
 */
export async function getMovieList(list: MovieList): Promise<ReadonlyArray<MediaSummary>> {
  "use cache";
  cacheLife(CACHE_LIFE.trending);
  cacheTag(CacheTag.Tmdb, CacheTag.movieList(list));

  const { results } = parseMoviePage(await tmdbGet(`movie/${list}`, { region: APP_REGION }));
  if (list !== MovieList.Upcoming) return results;
  const today = toIsoDate(new Date());
  return results
    .filter((movie) => movie.releaseDate !== null && movie.releaseDate >= today)
    .toSorted((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));
}

const keywordSchema = z.object({ id: z.number(), name: z.string() });

/** Keyword name for the "Keyword: …" filter chip; null if TMDB doesn't know the id. */
export async function getKeyword(id: number): Promise<Genre | null> {
  "use cache";
  cacheLife(CACHE_LIFE.genres);
  cacheTag(CacheTag.Tmdb);

  try {
    return keywordSchema.parse(await tmdbGet(`keyword/${id}`));
  } catch (error) {
    if (isTmdbRequestError(error) && error.status === HttpStatus.NotFound) return null;
    throw error;
  }
}

/**
 * One discover page, cached per (type, filters, page) and shared by every visitor.
 * The browse page renders page 1 on the server with this, so the grid arrives with the HTML
 * instead of after hydration + a client fetch.
 */
export async function getDiscoverPage(
  mediaType: MediaType,
  filters: CatalogFilters,
  page = 1,
): Promise<Paged<MediaSummary>> {
  "use cache";
  cacheLife(CACHE_LIFE.discover);
  cacheTag(CacheTag.Tmdb, CacheTag.discover(mediaType));

  const raw = await tmdbGet(`discover/${mediaType}`, {
    ...toDiscoverParams(mediaType, filters),
    page,
  });
  return PAGE_PARSERS[mediaType](raw);
}
