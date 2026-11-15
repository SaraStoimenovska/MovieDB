/** Route ids are TMDB ids: positive integers (10 digits covers any realistic id). */
const TMDB_ID_PATTERN = /^\d{1,10}$/;

/** Route param → TMDB id, or null for anything that isn't a positive integer. */
export const parseTmdbId = (value: string): number | null => {
  if (!TMDB_ID_PATTERN.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
};
