import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTrending } from "@/modules/catalog/server";
import { LibraryActions, toMediaSnapshot } from "@/modules/library";
import { parseMediaId } from "@/modules/media-details";
import { buildMediaMetadata, MediaDetailsView } from "@/modules/media-details/server";
import { PageSpinner } from "@/shared/ui/spinner";

/** Prerender this week's trending series; any other id renders on first request (ISR). */
export async function generateStaticParams() {
  const trending = await getTrending("tv");
  return trending.slice(0, 10).map((series) => ({ id: String(series.id) }));
}

export async function generateMetadata({ params }: PageProps<"/tv/[id]">) {
  return buildMediaMetadata("tv", (await params).id);
}

export default function SeriesPage({ params }: PageProps<"/tv/[id]">) {
  return (
    <Suspense fallback={<PageSpinner label="Loading series" />}>
      <SeriesDetails params={params} />
    </Suspense>
  );
}

async function SeriesDetails({ params }: Pick<PageProps<"/tv/[id]">, "params">) {
  const id = parseMediaId((await params).id);
  if (id === null) notFound();
  return (
    <MediaDetailsView
      mediaType="tv"
      id={id}
      // Snapshot: pass only card fields to the client buttons, not the whole details payload.
      renderActions={(media) => <LibraryActions media={toMediaSnapshot(media)} />}
    />
  );
}
