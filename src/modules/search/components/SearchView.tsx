"use client";

import { useSearchParams } from "next/navigation";
import { InfiniteMediaResults } from "@/modules/media";
import { QueryParam } from "@/shared/config/routes";
import { useSearchInfinite } from "../hooks/useSearchInfinite";
import { isSearchable, MIN_QUERY_LENGTH, normalizeQuery, SEARCH_HOTKEY } from "../model/search";

/** Results page. The query comes from `?q=`, which the header search field keeps up to date. */
export function SearchView() {
  const query = normalizeQuery(useSearchParams().get(QueryParam.Search));
  const results = useSearchInfinite(query);

  if (!isSearchable(query)) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        Use the search field at the top to find movies and series (at least {MIN_QUERY_LENGTH}{" "}
        characters). Tip: press{" "}
        <kbd className="rounded border px-1 font-mono text-xs">{SEARCH_HOTKEY}</kbd> to jump to it.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg text-muted-foreground">
        Results for <span className="font-semibold text-foreground">&ldquo;{query}&rdquo;</span>
      </h2>
      <InfiniteMediaResults
        query={results}
        showType
        emptyMessage={`No movies or series found for "${query}".`}
      />
    </div>
  );
}
