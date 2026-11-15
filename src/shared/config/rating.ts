/** Ratings are 1–10 everywhere in the app (same scale as TMDB): reviews and personal ratings. */
export const RATING_SCALE = { min: 1, max: 10 } as const;

export const isValidRating = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= RATING_SCALE.min &&
  value <= RATING_SCALE.max;
