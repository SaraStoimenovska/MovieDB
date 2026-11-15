import { trendingStaticParams } from "@/modules/catalog/server";
import { buildMediaMetadata, MediaDetailsPage } from "@/modules/media-details/server";
import { MediaType } from "@/shared/lib/tmdb/types";
import {
  renderDetailsActions,
  renderDetailsExtras,
  renderDetailsRecommendations,
} from "@/app/_details/slots";

export const generateStaticParams = () => trendingStaticParams(MediaType.Movie);

export async function generateMetadata({ params }: PageProps<"/movie/[id]">) {
  return buildMediaMetadata(MediaType.Movie, (await params).id);
}

export default function MoviePage({ params }: PageProps<"/movie/[id]">) {
  return (
    <MediaDetailsPage
      mediaType={MediaType.Movie}
      params={params}
      renderActions={renderDetailsActions}
      renderExtra={renderDetailsExtras}
      renderRecommendations={renderDetailsRecommendations}
    />
  );
}
