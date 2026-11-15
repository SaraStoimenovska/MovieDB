import { tmdbProxyGet } from "@/shared/lib/tmdb/browser";
import { parseMultiPage } from "@/shared/lib/tmdb/mappers";
import { type MediaSummary, type Paged } from "@/shared/lib/tmdb/types";

/** Movies and series in one search (people are filtered out by the mapper). */
export const fetchSearchPage = async (
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<Paged<MediaSummary>> =>
  parseMultiPage(await tmdbProxyGet("search/multi", { query, page, include_adult: false }, signal));
