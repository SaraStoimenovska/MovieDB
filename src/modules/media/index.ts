/** Presentational building blocks shared by every feature that shows movies/series. */
export { MediaCard } from "./components/MediaCard";
export { MediaPoster } from "./components/MediaPoster";
export { MediaRating } from "./components/MediaRating";
export { MediaGrid } from "./components/MediaGrid";
export { MediaCarousel, AUTOPLAY_DELAY_MS } from "./components/MediaCarousel";
export { InfiniteMediaResults } from "./components/InfiniteMediaResults";
export {
  MediaCardActionsProvider,
  useMediaCardActions,
  type MediaCardActionsRenderer,
} from "./context/card-actions";
export { flattenUniquePages } from "./model/media-list";
