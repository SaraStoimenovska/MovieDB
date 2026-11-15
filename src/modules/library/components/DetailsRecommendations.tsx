"use client";

import { MediaCarousel } from "@/modules/media";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { useLibraryEntry } from "../hooks/useLibrary";

type Props = {
  /** The title whose details page this is. */
  readonly media: Pick<MediaSummary, "key" | "title">;
  /** TMDB recommendations for it (already on the page, no extra request). */
  readonly items: ReadonlyArray<MediaSummary>;
};

/**
 * Recommendations on a details page: "Because you liked …" when this title is a favorite,
 * "You might also like" otherwise (also before hydration, matching the server HTML).
 */
export function DetailsRecommendations({ media, items }: Props) {
  const entry = useLibraryEntry(media.key);
  const title = entry?.isFavorite ? `Because you liked ${media.title}` : "You might also like";
  return <MediaCarousel title={title} items={items} />;
}
