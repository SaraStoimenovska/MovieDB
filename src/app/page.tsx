import { Suspense } from "react";
import { TrendingHeroSection, TrendingRow } from "@/modules/catalog/server";
import { routes } from "@/shared/config/routes";
import { PageSpinner } from "@/shared/ui/spinner";

/** Each section streams on its own; with cached data all of it is in the prerendered shell. */
export default function HomePage() {
  return (
    <div className="space-y-12">
      <h1 className="sr-only">Trending movies and series</h1>
      <Suspense fallback={<PageSpinner className="min-h-[40vh]" label="Loading trending" />}>
        <TrendingHeroSection />
      </Suspense>
      <Suspense fallback={<PageSpinner className="min-h-72" label="Loading trending movies" />}>
        <TrendingRow
          title="Trending movies this week"
          scope="movie"
          href={routes.browse("movie")}
        />
      </Suspense>
      <Suspense fallback={<PageSpinner className="min-h-72" label="Loading trending series" />}>
        <TrendingRow title="Trending series this week" scope="tv" href={routes.browse("tv")} />
      </Suspense>
    </div>
  );
}
