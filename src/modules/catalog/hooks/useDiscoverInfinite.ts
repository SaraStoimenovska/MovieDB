"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getNextPageParam } from "@/shared/lib/tmdb/mappers";
import { type MediaSummary, type MediaType, type Paged } from "@/shared/lib/tmdb/types";
import { fetchDiscoverPage } from "../api/client";
import { type CatalogFilters } from "../model/filters";
import { catalogKeys } from "../model/query-keys";

/**
 * Infinite discover query. `initialPage` is the server-rendered first page: it seeds the cache
 * so nothing is refetched on hydration; only page 2+ go through the client.
 */
export const useDiscoverInfinite = (
  mediaType: MediaType,
  filters: CatalogFilters,
  initialPage?: Paged<MediaSummary>,
) =>
  useInfiniteQuery({
    queryKey: catalogKeys.discover(mediaType, filters),
    queryFn: ({ pageParam, signal }) => fetchDiscoverPage(mediaType, filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam,
    initialData: initialPage ? { pages: [initialPage], pageParams: [1] } : undefined,
  });
