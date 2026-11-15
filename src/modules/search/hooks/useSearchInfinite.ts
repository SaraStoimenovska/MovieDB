"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { getNextPageParam } from "@/shared/lib/tmdb/mappers";
import { fetchSearchPage } from "../api/client";
import { isSearchable, searchKeys } from "../model/search";

export const useSearchInfinite = (query: string) =>
  useInfiniteQuery({
    queryKey: searchKeys.multi(query),
    queryFn: ({ pageParam, signal }) => fetchSearchPage(query, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam,
    enabled: isSearchable(query),
    // Keep the previous results on screen while the next query loads (no flash of skeletons per keystroke).
    placeholderData: keepPreviousData,
  });
