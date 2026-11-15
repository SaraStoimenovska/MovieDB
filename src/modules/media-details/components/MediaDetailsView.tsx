import "server-only";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { MediaCarousel } from "@/modules/media";
import { type MediaType } from "@/shared/lib/tmdb/types";
import { getMediaDetails } from "../api/server";
import { type MediaDetails } from "../model/details";
import { CastList } from "./CastList";
import { ImageGallery } from "./ImageGallery";
import { MediaFacts } from "./MediaFacts";
import { MediaHero } from "./MediaHero";
import { SeasonsList } from "./SeasonsList";
import { TmdbReviews } from "./TmdbReviews";
import { VideosSection } from "./VideosSection";
import { WatchProvidersSection } from "./WatchProvidersSection";

type Props = {
  readonly mediaType: MediaType;
  readonly id: number;
  /** Interactive actions (favorite, watchlist) injected by the page. */
  readonly renderActions?: (media: MediaDetails) => ReactNode;
  /** Extra sections (personal notes, local reviews) injected by the page. */
  readonly renderExtra?: (media: MediaDetails) => ReactNode;
};

export async function MediaDetailsView({ mediaType, id, renderActions, renderExtra }: Props) {
  const media = await getMediaDetails(mediaType, id);
  if (!media) notFound();

  return (
    <div className="space-y-12">
      <MediaHero media={media} actions={renderActions?.(media)} />
      <WatchProvidersSection providers={media.watchProviders} />
      <VideosSection videos={media.videos} />
      <CastList cast={media.cast} />
      <MediaFacts media={media} />
      {media.mediaType === "tv" && <SeasonsList title={media.title} seasons={media.seasons} />}
      <ImageGallery title={media.title} images={media.backdrops} />
      {renderExtra?.(media)}
      <TmdbReviews
        reviews={media.tmdbReviews}
        total={media.tmdbReviewCount}
        tmdbUrl={`https://www.themoviedb.org/${media.mediaType}/${media.id}`}
      />
      <MediaCarousel title="You might also like" items={media.recommendations} />
    </div>
  );
}
