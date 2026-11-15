import { type Metadata } from "next";
import { Suspense } from "react";
import { genreNameMap } from "@/modules/catalog/server";
import { FavoritesView } from "@/modules/library";
import { PageSpinner } from "@/shared/ui/spinner";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground">Movies and series you love, saved in this browser.</p>
      </header>
      <Suspense fallback={<PageSpinner label="Loading favorites" />}>
        <Favorites />
      </Suspense>
    </div>
  );
}

/** Genre names (for the genre filter) come from TMDB, cached; the list itself is local. */
async function Favorites() {
  return <FavoritesView genreNames={await genreNameMap()} />;
}
