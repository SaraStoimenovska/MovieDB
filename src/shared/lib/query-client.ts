import { QueryClient } from "@tanstack/react-query";
import { QUERY_CACHE_MS } from "@/shared/config/timing";

/** TMDB data changes slowly: cache generously and don't refetch on every focus. */
export const makeQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_CACHE_MS.stale,
        gcTime: QUERY_CACHE_MS.gc,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
