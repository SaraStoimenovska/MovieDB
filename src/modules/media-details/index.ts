/** Client-safe public API of the media-details module. Server-only exports live in `./server`. */
export {
  type MediaDetails,
  type CastMember,
  type Video,
  type ImageAsset,
  type WatchProviders,
  parseMediaId,
} from "./model/details";
