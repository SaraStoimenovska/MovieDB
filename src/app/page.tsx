import { Suspense } from "react";
import {
  MovieList,
  MovieListRow,
  TrendingHeroSection,
  TrendingRow,
  TrendingScope,
} from "@/modules/catalog/server";
import { UpNextRow } from "@/modules/episodes";
import { routes } from "@/shared/config/routes";
import { MediaType } from "@/shared/lib/tmdb/types";
import { PageSpinner } from "@/shared/ui/spinner";

const ROW_FALLBACK = "min-h-72";

/**
 * Personal rows (Up next, Because you liked…) render in the browser from localStorage and
 * stay hidden until there is something to show. TMDB rows are cached on the server and
 * stream in their own Suspense boundaries.
 */
export default function HomePage() {
  return (
    <div className="space-y-10 sm:space-y-12">
      <h1 className="sr-only">Trending movies and series</h1>
      <Suspense fallback={<PageSpinner className="min-h-[40vh]" label="Loading trending" />}>
        <TrendingHeroSection />
      </Suspense>
      <UpNextRow />
      <Suspense fallback={<PageSpinner className={ROW_FALLBACK} label="Loading trending movies" />}>
        <TrendingRow
          title="Trending movies this week"
          scope={TrendingScope.Movie}
          href={routes.browse(MediaType.Movie)}
        />
      </Suspense>
      <Suspense fallback={<PageSpinner className={ROW_FALLBACK} label="Loading trending series" />}>
        <TrendingRow
          title="Trending series this week"
          scope={TrendingScope.Tv}
          href={routes.browse(MediaType.Tv)}
        />
      </Suspense>
      <Suspense
        fallback={<PageSpinner className={ROW_FALLBACK} label="Loading movies in theaters" />}
      >
        <MovieListRow title="In theaters" list={MovieList.NowPlaying} />
      </Suspense>
      <Suspense fallback={<PageSpinner className={ROW_FALLBACK} label="Loading upcoming movies" />}>
        <MovieListRow title="Coming soon" list={MovieList.Upcoming} />
      </Suspense>
    </div>
  );
}
