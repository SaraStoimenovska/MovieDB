import { type MediaKey, type MediaSummary, type Paged } from "@/shared/lib/tmdb/types";

/**
 * Flattens infinite-query pages into one list. TMDB's discover/search paging is not stable
 * (popularity shifts between requests), so the same title can appear on two pages: keep the first.
 * Linear time: the Map is built from reversed entries so the *first* index of each key wins.
 */
export const flattenUniquePages = (
  pages: ReadonlyArray<Paged<MediaSummary>>,
): ReadonlyArray<MediaSummary> => {
  const items = pages.flatMap((page) => page.results);
  const firstIndex: ReadonlyMap<MediaKey, number> = new Map(
    items.map((item, index) => [item.key, index] as const).toReversed(),
  );
  return items.filter((item, index) => firstIndex.get(item.key) === index);
};
