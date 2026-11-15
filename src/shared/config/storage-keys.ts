/**
 * Every localStorage key the app owns, in one registry so keys never collide and are easy to
 * find (and to clear). Prefix `mdb:` namespaces them from other apps on the same origin.
 */
export const STORAGE_KEYS = {
  theme: "mdb:theme",
  library: "mdb:library",
  notes: "mdb:notes",
  reviews: "mdb:reviews",
  comments: "mdb:comments",
  episodes: "mdb:episodes",
  preferences: "mdb:preferences",
} as const;
