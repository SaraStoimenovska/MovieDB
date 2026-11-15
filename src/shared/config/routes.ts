import { type MediaType } from "@/shared/lib/tmdb/types";

/** Single source of truth for app URLs, so links never drift from the route tree. */
export const routes = {
  home: () => "/",
  browse: (mediaType?: MediaType) => (mediaType === "tv" ? "/browse?type=tv" : "/browse"),
  search: (query?: string) =>
    query ? `/search?${new URLSearchParams({ q: query }).toString()}` : "/search",
  favorites: () => "/favorites",
  myList: () => "/my-list",
  preferences: () => "/preferences",
  media: (mediaType: MediaType, id: number) => `/${mediaType}/${id}`,
} as const;

export type NavItem = { readonly label: string; readonly href: string };

/** Primary navigation: few, top-level destinations. Personal pages live in the user menu. */
export const mainNav: ReadonlyArray<NavItem> = [
  { label: "Home", href: routes.home() },
  { label: "Browse", href: routes.browse() },
];

export const userNav: ReadonlyArray<NavItem> = [
  { label: "Favorites", href: routes.favorites() },
  { label: "My list", href: routes.myList() },
  { label: "Preferences", href: routes.preferences() },
];
