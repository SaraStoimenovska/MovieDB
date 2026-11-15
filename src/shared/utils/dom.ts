/** "Trending movies this week" → "carousel-trending-movies-this-week": a stable, valid DOM id. */
export const toDomId = (prefix: string, text: string): string =>
  `${prefix}-${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
