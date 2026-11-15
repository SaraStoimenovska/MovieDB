/** TMDB image CDN. Public, not secret, so it lives in code rather than env. */
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";
export type BackdropSize = "w300" | "w780" | "w1280" | "original";
export type ProfileSize = "w45" | "w185" | "h632" | "original";
export type LogoSize = "w45" | "w92" | "w154" | "w185" | "w300" | "w500" | "original";
export type TmdbImageSize = PosterSize | BackdropSize | ProfileSize | LogoSize;

export const tmdbImageUrl = (
  path: string | null | undefined,
  size: TmdbImageSize = "w342",
): string | null => (path ? `${TMDB_IMAGE_BASE_URL}/${size}/${path.replace(/^\/+/, "")}` : null);
