import "server-only";
import { connection } from "next/server";
import { Suspense } from "react";
import { FIRST_PAGE } from "@/shared/lib/tmdb/constants";
import { MediaType } from "@/shared/lib/tmdb/types";
import { PageSpinner } from "@/shared/ui/spinner";
import { getDiscoverPage, getGenres, getKeyword } from "../api/server";
import { maxFilterYear, parseBrowseState, toSearchParamsLike } from "../model/filters";
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
  const params = await searchParams;
  // The year range depends on today's date: mark this as request-time work (Cache Components
  // must not read the clock while prerendering), and hand the result to the client filters.
  await connection();
  const maxYear = maxFilterYear();
  const state = parseBrowseState(toSearchParamsLike(params), maxYear);
  const [movieGenres, tvGenres, initialPage, keyword] = await Promise.all([
    getGenres(MediaType.Movie),
    getGenres(MediaType.Tv),
    getDiscoverPage(state.mediaType, state.filters, FIRST_PAGE),
    state.filters.keywordId === null ? null : getKeyword(state.filters.keywordId),
  ]);

  return (
    <CatalogBrowser
      state={state}
      genres={{ [MediaType.Movie]: movieGenres, [MediaType.Tv]: tvGenres }}
      keywordName={keyword?.name ?? null}
      maxYear={maxYear}
      initialPage={initialPage}
    />
  );
}
