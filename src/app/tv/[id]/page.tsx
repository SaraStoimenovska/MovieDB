import { trendingStaticParams } from "@/modules/catalog/server";
import { buildMediaMetadata, MediaDetailsPage } from "@/modules/media-details/server";
import { MediaType } from "@/shared/lib/tmdb/types";
import {
  renderDetailsActions,
  renderDetailsExtras,
  renderDetailsRecommendations,
  renderDetailsSeasons,
} from "@/app/_details/slots";

export const generateStaticParams = () => trendingStaticParams(MediaType.Tv);

export async function generateMetadata({ params }: PageProps<"/tv/[id]">) {
  return buildMediaMetadata(MediaType.Tv, (await params).id);
}

export default function SeriesPage({ params }: PageProps<"/tv/[id]">) {
  return (
    <MediaDetailsPage
      mediaType={MediaType.Tv}
      params={params}
      renderActions={renderDetailsActions}
      renderSeasons={renderDetailsSeasons}
      renderExtra={renderDetailsExtras}
      renderRecommendations={renderDetailsRecommendations}
    />
  );
}
