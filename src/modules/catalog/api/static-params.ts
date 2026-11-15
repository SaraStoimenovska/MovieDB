import "server-only";
import { PRERENDERED_TITLES } from "@/shared/config/app";
import { type MediaType } from "@/shared/lib/tmdb/types";
import { getTrending } from "./server";

/**
 * `generateStaticParams` for detail routes: this week's top trending titles are built ahead,
 * any other id renders on first request and is then cached (ISR).
 */
// Mutable array type on purpose: it's Next's `generateStaticParams` contract.
export const trendingStaticParams = async (mediaType: MediaType): Promise<{ id: string }[]> =>
  (await getTrending(mediaType))
    .slice(0, PRERENDERED_TITLES)
    .map((media) => ({ id: String(media.id) }));
