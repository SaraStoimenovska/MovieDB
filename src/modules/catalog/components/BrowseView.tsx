import "server-only";
import { Suspense } from "react";
import { PageSpinner } from "@/shared/ui/spinner";
import { getDiscoverPage, getGenres } from "../api/server";
import { parseBrowseState, toSearchParamsLike } from "../model/filters";
import { CatalogBrowser } from "./CatalogBrowser";

type SearchParams = Promise<Record<string, string | ReadonlyArray<string> | undefined>>;

/**
 * Static shell: heading. Dynamic hole (inside Suspense): reads `searchParams`, renders
 * page 1 from the shared server cache, and hands it to the client browser.
 */
export function BrowseView({ searchParams }: { readonly searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Browse</h1>
        <p className="text-muted-foreground">
          Filter movies and series by popularity, rating, genre and year.
        </p>
      </header>
      <Suspense fallback={<PageSpinner label="Loading titles" />}>
        <BrowseResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BrowseResults({ searchParams }: { readonly searchParams: SearchParams }) {
  const state = parseBrowseState(toSearchParamsLike(await searchParams));
  const [movieGenres, tvGenres, initialPage] = await Promise.all([
    getGenres("movie"),
    getGenres("tv"),
    getDiscoverPage(state.mediaType, state.filters, 1),
  ]);

  return (
    <CatalogBrowser
      state={state}
      genres={{ movie: movieGenres, tv: tvGenres }}
      initialPage={initialPage}
    />
  );
}
