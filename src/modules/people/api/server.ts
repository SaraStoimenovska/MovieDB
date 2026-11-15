import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { CACHE_LIFE, CacheTag } from "@/shared/config/cache";
import { HttpStatus } from "@/shared/config/http";
import { isTmdbRequestError, tmdbGet } from "@/shared/lib/tmdb/client";
import { parsePerson, type PersonDetails } from "../model/person";

/** Person with all credits in one request; `null` for unknown ids (→ `notFound()`). */
export async function getPerson(id: number): Promise<PersonDetails | null> {
  "use cache";
  cacheLife(CACHE_LIFE.details);
  cacheTag(CacheTag.Tmdb, CacheTag.person(id));

  try {
    return parsePerson(await tmdbGet(`person/${id}`, { append_to_response: "combined_credits" }));
  } catch (error) {
    if (isTmdbRequestError(error) && error.status === HttpStatus.NotFound) return null;
    throw error;
  }
}

const POPULAR_PEOPLE_PRERENDERED = 5;

/** `generateStaticParams` for /person/[id]: a few popular people built ahead, others on demand. */
export async function popularPeopleParams(): Promise<{ id: string }[]> {
  "use cache";
  cacheLife(CACHE_LIFE.trending);
  cacheTag(CacheTag.Tmdb);

  const page = z
    .object({ results: z.array(z.object({ id: z.number() })) })
    .parse(await tmdbGet("person/popular"));
  return page.results
    .slice(0, POPULAR_PEOPLE_PRERENDERED)
    .map((person) => ({ id: String(person.id) }));
}
