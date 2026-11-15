import "server-only";

/** Server-only public API of the catalog module. */
export { genreNameMap, MovieList, TrendingScope } from "./api/server";
export { trendingStaticParams } from "./api/static-params";
export { TrendingRow } from "./components/TrendingRow";
export { TrendingHeroSection } from "./components/TrendingHeroSection";
export { MovieListRow } from "./components/MovieListRow";
export { BrowseView } from "./components/BrowseView";
