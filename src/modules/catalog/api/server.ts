import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tmdbGet } from "@/shared/lib/tmdb/client";
import { parseMoviePage, parseMultiPage, parseTvPage } from "@/shared/lib/tmdb/mappers";
import { type MediaSummary, type MediaType, type Paged } from "@/shared/lib/tmdb/types";
import { type CatalogFilters, toDiscoverParams } from "../model/filters";
import { type Genre, parseGenreList } from "../model/genres";

export type TrendingScope = MediaType | "all";
export type TrendingWindow = "day" | "week";

const PARSERS = { all: parseMultiPage, movie: parseMoviePage, tv: parseTvPage } as const;

export async function getTrending(
  scope: TrendingScope,
  window: TrendingWindow = "week",
): Promise<ReadonlyArray<MediaSummary>> {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", `trending:${scope}:${window}`);

  const raw = await tmdbGet(`trending/${scope}/${window}`);
  return PARSERS[scope](raw).results;
}

export async function getGenres(mediaType: MediaType): Promise<ReadonlyArray<Genre>> {
  "use cache";
  cacheLife("days");
  cacheTag("tmdb", `genres:${mediaType}`);

  return parseGenreList(await tmdbGet(`genre/${mediaType}/list`));
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
  cacheLife("hours");
  cacheTag("tmdb", `discover:${mediaType}`);

  const raw = await tmdbGet(`discover/${mediaType}`, {
    ...toDiscoverParams(mediaType, filters),
    page,
  });
  return (mediaType === "movie" ? parseMoviePage : parseTvPage)(raw);
}
