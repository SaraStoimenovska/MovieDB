import "server-only";

/** Server-only public API of the catalog module. */
export {
  getTrending,
  getGenres,
  getDiscoverPage,
  type TrendingScope,
  type TrendingWindow,
} from "./api/server";
export { TrendingRow } from "./components/TrendingRow";
export { TrendingHeroSection } from "./components/TrendingHeroSection";
export { BrowseView } from "./components/BrowseView";
