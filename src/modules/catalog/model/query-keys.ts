import { type MediaType } from "@/shared/lib/tmdb/types";
import { type CatalogFilters } from "./filters";

/** TanStack Query key factory: one place to build (and later invalidate) catalog keys. */
export const catalogKeys = {
  all: ["catalog"] as const,
  discover: (mediaType: MediaType, filters: CatalogFilters) =>
    [...catalogKeys.all, "discover", mediaType, filters] as const,
};
