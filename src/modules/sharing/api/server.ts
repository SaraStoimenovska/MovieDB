import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_LIFE, CacheTag } from "@/shared/config/cache";
import { tmdbGet } from "@/shared/lib/tmdb/client";
import { parseDetailsSummary } from "@/shared/lib/tmdb/mappers";
import { type MediaSummary, type MediaType } from "@/shared/lib/tmdb/types";
import { type SharedList } from "../model/shared-list";

/** One title's card data, cached per title (shared links reuse it). `null` if unavailable. */
async function getTitleSummary(mediaType: MediaType, id: number): Promise<MediaSummary | null> {
  "use cache";
  cacheLife(CACHE_LIFE.details);
  cacheTag(CacheTag.Tmdb, CacheTag.media(mediaType, id));

  try {
    return parseDetailsSummary(mediaType, await tmdbGet(`${mediaType}/${id}`));
  } catch {
    // Deleted / unknown ids are simply left out of the shared list.
    return null;
  }
}

/** The shared list's titles, in the sender's order; unavailable ones are skipped. */
export async function resolveSharedList(list: SharedList): Promise<ReadonlyArray<MediaSummary>> {
  const summaries = await Promise.all(
    list.items.map((item) => getTitleSummary(item.mediaType, item.id)),
  );
  return summaries.filter((summary): summary is MediaSummary => summary !== null);
}
