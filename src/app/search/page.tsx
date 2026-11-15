import { type Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/modules/search";
import { PageSpinner } from "@/shared/ui/spinner";

export const metadata: Metadata = {
  title: "Search",
  description: "Search movies and TV series.",
};

/** Results page; the query is typed in the header search field. Not linked from the nav. */
export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>
      {/* SearchView reads `?q=` with useSearchParams, which needs a Suspense boundary. */}
      <Suspense fallback={<PageSpinner label="Loading results" />}>
        <SearchView />
      </Suspense>
    </div>
  );
}
