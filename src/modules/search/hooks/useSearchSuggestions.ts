"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FIRST_PAGE } from "@/shared/lib/tmdb/constants";
import { fetchSearchPage } from "../api/client";
import { isSearchable, searchKeys, SUGGESTION_LIMIT } from "../model/search";

/** Top results for the header dropdown (first page only, trimmed). */
export const useSearchSuggestions = (query: string, enabled = true) =>
  useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: async ({ signal }) =>
      (await fetchSearchPage(query, FIRST_PAGE, signal)).results.slice(0, SUGGESTION_LIMIT),
    enabled: enabled && isSearchable(query),
    placeholderData: keepPreviousData,
  });
