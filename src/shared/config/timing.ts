/** Every delay/duration in the UI, named, so behaviour is tunable in one place. */

export const DEBOUNCE_MS = {
  /** Typing → search request. */
  search: 300,
  /** Typing → note autosave. */
  autosave: 800,
} as const;

/** Carousels auto-advance every 5s: long enough to read a title, short enough to feel alive. */
export const AUTOPLAY_DELAY_MS = 5000;

/** Embla scroll animation duration (its own unit, roughly ms/10). */
export const CAROUSEL_DURATION = { cards: 30, hero: 35 } as const;

/** TanStack Query caching for TMDB data (changes slowly). */
export const QUERY_CACHE_MS = {
  stale: 5 * 60 * 1000,
  gc: 30 * 60 * 1000,
} as const;

/** Start loading the next page this far (~2 screens) before the end of the list is visible, so it is usually ready before the user gets there. */
export const INFINITE_SCROLL_ROOT_MARGIN = "1500px";

/** CDN/browser caching of `/api/tmdb/*` responses, in seconds. */
export const PROXY_CACHE_SECONDS = { maxAge: 300, staleWhileRevalidate: 600 } as const;
