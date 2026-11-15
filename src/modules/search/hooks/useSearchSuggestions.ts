"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchSearchPage } from "../api/client";
import { isSearchable, searchKeys, SUGGESTION_LIMIT } from "../model/search";

/** Top results for the header dropdown (first page only, trimmed). */
export const useSearchSuggestions = (query: string, enabled = true) =>
  useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: async ({ signal }) =>
      (await fetchSearchPage(query, 1, signal)).results.slice(0, SUGGESTION_LIMIT),
    enabled: enabled && isSearchable(query),
    placeholderData: keepPreviousData,
  });
