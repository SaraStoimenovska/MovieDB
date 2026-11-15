import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { APP_REGION } from "@/shared/config/app";
import { CACHE_LIFE, CacheTag } from "@/shared/config/cache";
import { HttpStatus } from "@/shared/config/http";
import { isTmdbRequestError, tmdbGet } from "@/shared/lib/tmdb/client";
import { type MediaType } from "@/shared/lib/tmdb/types";
import {
  DETAILS_PARSERS,
  detailsRequestParams,
  type MediaDetails,
  needsArtworkFallback,
  withArtworkFallback,
} from "../model/details";

/**
 * Everything for the details page in one cached request (credits, videos, images, keywords,
 * providers, reviews, ratings…). Returns `null` for unknown ids (TMDB 404) → `notFound()`.
 */
export async function getMediaDetails(
  mediaType: MediaType,
  id: number,
): Promise<MediaDetails | null> {
  "use cache";
  cacheLife(CACHE_LIFE.details);
  cacheTag(CacheTag.Tmdb, CacheTag.media(mediaType, id));

  try {
    const raw = await tmdbGet(`${mediaType}/${id}`, detailsRequestParams(mediaType));
    const details = DETAILS_PARSERS[mediaType](raw, APP_REGION);
    return needsArtworkFallback(details) ? await addArtworkFallback(mediaType, details) : details;
  } catch (error) {
    if (isTmdbRequestError(error) && error.status === HttpStatus.NotFound) return null;
    throw error;
  }
}

/**
 * Some titles have no artwork in the UI language (TMDB picks the poster per language), while
 * the trending/list endpoints may still show an older one. One small extra request in the best
 * translation's language fills the gap; if it fails, the page keeps its fallback poster.
 */
async function addArtworkFallback(mediaType: MediaType, details: MediaDetails) {
  try {
    const raw = await tmdbGet(`${mediaType}/${details.id}`, {
      language: details.fallbackLanguage,
    });
    return withArtworkFallback(details, raw);
  } catch {
    return details;
  }
}
