import { type Metadata } from "next";
import { Suspense } from "react";
import { genreNameMap } from "@/modules/catalog/server";
import { MyListView } from "@/modules/library";
import { PageSpinner } from "@/shared/ui/spinner";

export const metadata: Metadata = { title: "My list" };

export default function MyListPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My list</h1>
        <p className="text-muted-foreground">
          What you want to watch next, and what you&apos;ve already seen.
        </p>
      </header>
      <Suspense fallback={<PageSpinner label="Loading your list" />}>
        <MyList />
      </Suspense>
    </div>
  );
}

/** Genre names (for the genre filter) come from TMDB, cached; the list itself is local. */
async function MyList() {
  return <MyListView genreNames={await genreNameMap()} />;
}
