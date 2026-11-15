import { Suspense } from "react";
import { CollectionSection } from "@/modules/collections/server";
import { EpisodeTracker } from "@/modules/episodes";
import { LibraryActions, snapshotToSummary, toMediaSnapshot } from "@/modules/library";
import { type MediaDetails } from "@/modules/media-details";
import { NotesSection } from "@/modules/notes";
import { ReviewsSection } from "@/modules/reviews";
import { MediaType } from "@/shared/lib/tmdb/types";

/**
 * The app composes features into the details page: media-details stays unaware of the
 * library, episodes, notes and reviews modules. (`_details` is a private folder: not a route.)
 */

/**
 * Only the card fields go to the client buttons, not the whole details payload. Movie runtime
 * is passed along for "time watched" in the stats (series use per-episode tracking instead).
 */
export const renderDetailsActions = (media: MediaDetails) => (
  <LibraryActions
    media={snapshotToSummary(toMediaSnapshot(media))}
    extras={{ runtimeMinutes: media.mediaType === MediaType.Movie ? media.runtimeMinutes : null }}
  />
);

export const renderDetailsSeasons = (media: MediaDetails) => (
  <EpisodeTracker
    show={{ key: media.key, id: media.id, title: media.title, posterPath: media.posterPath }}
    seasons={media.seasons.map((season) => ({
      number: season.number,
      name: season.name,
      episodeCount: season.episodeCount,
      airDate: season.airDate,
      posterPath: season.posterPath,
    }))}
  />
);

export const renderDetailsExtras = (media: MediaDetails) => (
  <>
    {media.collection && (
      // Streams in on its own: the rest of the page doesn't wait for the collection.
      <Suspense fallback={null}>
        <CollectionSection collectionId={media.collection.id} currentId={media.id} />
      </Suspense>
    )}
    <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
      <NotesSection mediaKey={media.key} title={media.title} />
      <ReviewsSection mediaKey={media.key} title={media.title} />
    </div>
  </>
);
