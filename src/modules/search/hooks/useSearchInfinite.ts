"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { FIRST_PAGE } from "@/shared/lib/tmdb/constants";
import { getNextPageParam } from "@/shared/lib/tmdb/mappers";
import { fetchSearchPage } from "../api/client";
import { isSearchable, searchKeys } from "../model/search";

export const useSearchInfinite = (query: string) =>
  useInfiniteQuery({
    queryKey: searchKeys.multi(query),
    queryFn: ({ pageParam, signal }) => fetchSearchPage(query, pageParam, signal),
    initialPageParam: FIRST_PAGE,
    getNextPageParam,
    enabled: isSearchable(query),
    // Keep the previous results on screen while the next query loads (no flash per keystroke).
    placeholderData: keepPreviousData,
  });
