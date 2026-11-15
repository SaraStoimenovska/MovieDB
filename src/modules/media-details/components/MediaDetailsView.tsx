import "server-only";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { MediaCarousel } from "@/modules/media";
import { MediaType } from "@/shared/lib/tmdb/types";
import { getMediaDetails } from "../api/server";
import { type MediaDetails } from "../model/details";
import { tmdbPageUrl } from "../model/presentation";
import { CastList } from "./CastList";
import { ImageGallery } from "./ImageGallery";
import { MediaFacts } from "./MediaFacts";
import { MediaHero } from "./MediaHero";

import { TmdbReviews } from "./TmdbReviews";
import { VideosSection } from "./VideosSection";
import { WatchProvidersSection } from "./WatchProvidersSection";

const DEFAULT_RECOMMENDATIONS_TITLE = "You might also like";

type Props = {
  readonly mediaType: MediaType;
  readonly id: number;
  /** Interactive actions (favorite, watchlist) injected by the page. */
  readonly renderActions?: (media: MediaDetails) => ReactNode;
  /** Series seasons section (e.g. the episode tracker), injected by the page. */
  readonly renderSeasons?: (media: MediaDetails) => ReactNode;
  /** Extra sections (personal notes, local reviews) injected by the page. */
  readonly renderExtra?: (media: MediaDetails) => ReactNode;
  /** Recommendations row; defaults to a plain "You might also like" carousel. */
  readonly renderRecommendations?: (media: MediaDetails) => ReactNode;
};

export async function MediaDetailsView({
  mediaType,
  id,
  renderActions,
  renderSeasons,
  renderExtra,
  renderRecommendations,
}: Props) {
  const media = await getMediaDetails(mediaType, id);
  if (!media) notFound();

  return (
    <div className="space-y-12">
      <MediaHero media={media} actions={renderActions?.(media)} />
      <WatchProvidersSection
        mediaType={media.mediaType}
        id={media.id}
        defaultProviders={media.watchProviders}
      />
      <VideosSection videos={media.videos} />
      <CastList cast={media.cast} />
      <MediaFacts media={media} />
      {media.mediaType === MediaType.Tv && renderSeasons?.(media)}
      <ImageGallery title={media.title} images={media.backdrops} />
      {renderExtra?.(media)}
      <TmdbReviews
        reviews={media.tmdbReviews}
        total={media.tmdbReviewCount}
        tmdbUrl={tmdbPageUrl(media)}
      />
      {renderRecommendations ? (
        renderRecommendations(media)
      ) : (
        <MediaCarousel title={DEFAULT_RECOMMENDATIONS_TITLE} items={media.recommendations} />
      )}
    </div>
  );
}
