import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTrending } from "@/modules/catalog/server";
import { LibraryActions, toMediaSnapshot } from "@/modules/library";
import { parseMediaId } from "@/modules/media-details";
import { buildMediaMetadata, MediaDetailsView } from "@/modules/media-details/server";
import { PageSpinner } from "@/shared/ui/spinner";

/** Prerender this week's trending movies; any other id renders on first request (ISR). */
export async function generateStaticParams() {
  const trending = await getTrending("movie");
  return trending.slice(0, 10).map((movie) => ({ id: String(movie.id) }));
}

export async function generateMetadata({ params }: PageProps<"/movie/[id]">) {
  return buildMediaMetadata("movie", (await params).id);
}

export default function MoviePage({ params }: PageProps<"/movie/[id]">) {
  return (
    <Suspense fallback={<PageSpinner label="Loading movie" />}>
      <MovieDetails params={params} />
    </Suspense>
  );
}

async function MovieDetails({ params }: Pick<PageProps<"/movie/[id]">, "params">) {
  const id = parseMediaId((await params).id);
  if (id === null) notFound();
  return (
    <MediaDetailsView
      mediaType="movie"
      id={id}
      // Snapshot: pass only card fields to the client buttons, not the whole details payload.
      renderActions={(media) => <LibraryActions media={toMediaSnapshot(media)} />}
    />
  );
}
