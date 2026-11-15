import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { APP_REGION } from "@/shared/config/app";
import { isTmdbRequestError, tmdbGet } from "@/shared/lib/tmdb/client";
import { type MediaType } from "@/shared/lib/tmdb/types";
import { DETAILS_PARSERS, detailsRequestParams, type MediaDetails } from "../model/details";

/**
 * Everything for the details page in one cached request (credits, videos, images, keywords,
 * providers, reviews, ratings…). Returns `null` for unknown ids (TMDB 404) → `notFound()`.
 */
export async function getMediaDetails(
  mediaType: MediaType,
  id: number,
): Promise<MediaDetails | null> {
  "use cache";
  cacheLife("days");
  cacheTag("tmdb", `media:${mediaType}:${id}`);

  try {
    const raw = await tmdbGet(`${mediaType}/${id}`, detailsRequestParams(mediaType));
    return DETAILS_PARSERS[mediaType](raw, APP_REGION);
  } catch (error) {
    if (isTmdbRequestError(error) && error.status === 404) return null;
    throw error;
  }
}
