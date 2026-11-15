import { type Metadata } from "next";
import { Suspense } from "react";
import { genreNameMap } from "@/modules/catalog/server";
import { StatsView } from "@/modules/stats";
import { PageSpinner } from "@/shared/ui/spinner";

export const metadata: Metadata = { title: "Your stats" };

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Your stats</h1>
        <p className="text-muted-foreground">
          What you&apos;ve watched, rated and written, from this browser.
        </p>
      </header>
      <Suspense fallback={<PageSpinner label="Loading stats" />}>
        <Stats />
      </Suspense>
    </div>
  );
}

/** Genre names come from TMDB (cached); everything else is computed in the browser. */
async function Stats() {
  return <StatsView genreNames={await genreNameMap()} />;
}
