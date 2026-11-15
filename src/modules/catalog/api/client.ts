import { tmdbProxyGet } from "@/shared/lib/tmdb/browser";
import { PAGE_PARSERS } from "@/shared/lib/tmdb/mappers";
import { type MediaSummary, type MediaType, type Paged } from "@/shared/lib/tmdb/types";
import { type CatalogFilters, toDiscoverParams } from "../model/filters";

export const fetchDiscoverPage = async (
  mediaType: MediaType,
  filters: CatalogFilters,
  page: number,
  signal?: AbortSignal,
): Promise<Paged<MediaSummary>> => {
  const raw = await tmdbProxyGet(
    `discover/${mediaType}`,
    { ...toDiscoverParams(mediaType, filters), page },
    signal,
  );
  return PAGE_PARSERS[mediaType](raw);
};
