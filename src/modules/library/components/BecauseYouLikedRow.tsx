"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { MediaCarousel } from "@/modules/media";
import { tmdbProxyGet } from "@/shared/lib/tmdb/browser";
import { PAGE_PARSERS } from "@/shared/lib/tmdb/mappers";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { useLibraryData } from "../hooks/useLibrary";
import { selectLatestFavorite } from "../model/library";

/** Recommendations shown in the row (one carousel's worth). */
const RECOMMENDATION_LIMIT = 18;

const recommendationKeys = {
  forMedia: (key: string) => ["library", "recommendations", key] as const,
};

/**
 * "Because you liked X": TMDB recommendations for your most recent favorite, minus titles
 * already in your library. Hidden until you have a favorite (and before hydration).
 */
export function BecauseYouLikedRow() {
  const { data } = useLibraryData();
  const favorite = selectLatestFavorite(data);
  const media = favorite?.media ?? null;

  const query = useQuery({
    queryKey: recommendationKeys.forMedia(media?.key ?? "none"),
    queryFn: async ({ signal }): Promise<ReadonlyArray<MediaSummary>> =>
      media
        ? PAGE_PARSERS[media.mediaType](
            await tmdbProxyGet(`${media.mediaType}/${media.id}/recommendations`, {}, signal),
          ).results
        : [],
    enabled: media !== null,
  });

  const items = useMemo(
    () =>
      (query.data ?? []).filter((item) => !data.entries[item.key]).slice(0, RECOMMENDATION_LIMIT),
    [query.data, data.entries],
  );

  if (!media || items.length === 0) return null;
  return <MediaCarousel title={`Because you liked ${media.title}`} items={items} />;
}
