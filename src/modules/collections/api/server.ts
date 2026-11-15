import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_LIFE, CacheTag } from "@/shared/config/cache";
import { HttpStatus } from "@/shared/config/http";
import { isTmdbRequestError, tmdbGet } from "@/shared/lib/tmdb/client";
import { type Collection, parseCollection } from "../model/collection";

/** A movie collection with its parts; `null` for unknown ids (→ `notFound()`). */
export async function getCollection(id: number): Promise<Collection | null> {
  "use cache";
  cacheLife(CACHE_LIFE.details);
  cacheTag(CacheTag.Tmdb, CacheTag.collection(id));

  try {
    return parseCollection(await tmdbGet(`collection/${id}`));
  } catch (error) {
    if (isTmdbRequestError(error) && error.status === HttpStatus.NotFound) return null;
    throw error;
  }
}

/**
 * `generateStaticParams` for /collection/[id]: one well-known franchise is built ahead
 * (Cache Components needs at least one); every other collection renders on first visit.
 * 86311 = "The Avengers Collection" on TMDB.
 */
const PRERENDERED_COLLECTIONS: ReadonlyArray<number> = [86311];

export const collectionStaticParams = (): { id: string }[] =>
  PRERENDERED_COLLECTIONS.map((id) => ({ id: String(id) }));
