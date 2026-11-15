import "server-only";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { type MediaType, MEDIA_TYPE_LABELS } from "@/shared/lib/tmdb/types";
import { PageSpinner } from "@/shared/ui/spinner";
import { parseTmdbId } from "@/shared/lib/tmdb/ids";
import { type MediaDetails } from "../model/details";
import { MediaDetailsView } from "./MediaDetailsView";

type Props = {
  readonly mediaType: MediaType;
  readonly params: Promise<{ readonly id: string }>;
  readonly renderActions?: (media: MediaDetails) => ReactNode;
  readonly renderSeasons?: (media: MediaDetails) => ReactNode;
  readonly renderExtra?: (media: MediaDetails) => ReactNode;
  readonly renderRecommendations?: (media: MediaDetails) => ReactNode;
};

/**
 * Whole details route body, shared by /movie/[id] and /tv/[id]. `params` is awaited inside
 * Suspense so Next can prerender the static shell (with a spinner) for ids not built ahead.
 */
export function MediaDetailsPage({ mediaType, params, ...slots }: Props) {
  return (
    <Suspense
      fallback={<PageSpinner label={`Loading ${MEDIA_TYPE_LABELS[mediaType].toLowerCase()}`} />}
    >
      <DetailsContent mediaType={mediaType} params={params} {...slots} />
    </Suspense>
  );
}

async function DetailsContent({ mediaType, params, ...slots }: Props) {
  const id = parseTmdbId((await params).id);
  if (id === null) notFound();
  return <MediaDetailsView mediaType={mediaType} id={id} {...slots} />;
}
