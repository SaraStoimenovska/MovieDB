"use client";

import { type InfiniteData, type UseInfiniteQueryResult } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useInView } from "@/shared/hooks/useInView";
import { type MediaSummary, type Paged } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { PageSpinner, Spinner } from "@/shared/ui/spinner";
import { flattenUniquePages } from "../model/media-list";
import { MediaGrid } from "./MediaGrid";

type Props = {
  readonly query: UseInfiniteQueryResult<InfiniteData<Paged<MediaSummary>>>;
  readonly emptyMessage: string;
  readonly showType?: boolean;
};

/**
 * Renders any paged TMDB infinite query as a grid that loads the next page
 * when the sentinel scrolls into view, with a manual retry when a page fails.
 */
export function InfiniteMediaResults({ query, emptyMessage, showType }: Props) {
  const {
    data,
    status,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetchNextPageError,
    refetch,
  } = query;
  const { ref, inView } = useInView({
    disabled: !hasNextPage || isFetchingNextPage || isFetchNextPageError,
  });

  const items = useMemo(() => flattenUniquePages(data?.pages ?? []), [data]);
  const totalResults = data?.pages[0]?.totalResults ?? 0;

  // Only fetch on a fresh "sentinel became visible" signal, never while a page is already loading.
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "pending") return <PageSpinner label="Loading titles" />;

  // In TanStack Query v5 a failed *next* page also sets status "error" while earlier pages stay
  // in `data`, so the full-page error is only for "nothing loaded"; otherwise retry inline below.
  if (status === "error" && items.length === 0) {
    return (
      <div role="alert" className="space-y-3 py-16 text-center">
        <p className="text-muted-foreground">Couldn&apos;t load titles. Please try again.</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-8">
      <p className="sr-only" aria-live="polite">
        Showing {items.length} of {totalResults} titles
      </p>
      <MediaGrid items={items} showType={showType} />

      <div ref={ref} className="flex min-h-16 items-center justify-center">
        {isFetchingNextPage && <Spinner label="Loading more titles" />}
        {isFetchNextPageError && (
          <Button variant="outline" onClick={() => void fetchNextPage()}>
            Couldn&apos;t load more. Retry
          </Button>
        )}
        {!hasNextPage && (
          <p className="text-sm text-muted-foreground">You&apos;ve reached the end.</p>
        )}
      </div>
    </div>
  );
}
