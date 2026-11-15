import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { CACHE_LIFE, CacheTag } from "@/shared/config/cache";
import { tmdbGet } from "@/shared/lib/tmdb/client";

export type Region = { readonly code: string; readonly name: string };

const regionsSchema = z.object({
  results: z.array(z.object({ iso_3166_1: z.string(), english_name: z.string() })),
});

/** Regions TMDB has streaming data for (for the Preferences region picker), A–Z. */
export async function getWatchRegions(): Promise<ReadonlyArray<Region>> {
  "use cache";
  cacheLife(CACHE_LIFE.genres);
  cacheTag(CacheTag.Tmdb);

  return regionsSchema
    .parse(await tmdbGet("watch/providers/regions"))
    .results.map((region) => ({ code: region.iso_3166_1, name: region.english_name }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
