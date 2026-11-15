import { MediaType } from "@/shared/lib/tmdb/types";

/** URL query keys the app reads, so producers and consumers never disagree on spelling. */
export const QueryParam = {
  Search: "q",
  Type: "type",
  Sort: "sort",
  Genre: "genre",
  Year: "year",
  Keyword: "keyword",
} as const;

type BrowseLink = {
  readonly mediaType?: MediaType;
  readonly genreId?: number;
  readonly keywordId?: number;
};

/** `/browse` with optional pre-applied filters (movies are the default tab, so omitted). */
const browseHref = ({ mediaType, genreId, keywordId }: BrowseLink = {}): string => {
  const query = new URLSearchParams(
    [
      mediaType === MediaType.Tv ? [QueryParam.Type, MediaType.Tv] : null,
      genreId ? [QueryParam.Genre, String(genreId)] : null,
      keywordId ? [QueryParam.Keyword, String(keywordId)] : null,
    ].filter((entry): entry is [string, string] => entry !== null),
  ).toString();
  return query ? `/browse?${query}` : "/browse";
};

/** Single source of truth for app URLs, so links never drift from the route tree. */
export const routes = {
  home: () => "/",
  browse: (filters?: MediaType | BrowseLink) =>
    browseHref(typeof filters === "string" ? { mediaType: filters } : filters),
  search: (query?: string) =>
    query ? `/search?${new URLSearchParams({ [QueryParam.Search]: query }).toString()}` : "/search",
  favorites: () => "/favorites",
  myList: () => "/my-list",
  upcoming: () => "/upcoming",
  /** `query` is the encoded list from the sharing module (`name=…&items=…`). */
  shared: (query: string) => `/shared?${query}`,
  preferences: () => "/preferences",
  stats: () => "/stats",
  media: (mediaType: MediaType, id: number) => `/${mediaType}/${id}`,
  person: (id: number) => `/person/${id}`,
  collection: (id: number) => `/collection/${id}`,
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
  { label: "Upcoming", href: routes.upcoming() },
  { label: "Your stats", href: routes.stats() },
  { label: "Preferences", href: routes.preferences() },
];
