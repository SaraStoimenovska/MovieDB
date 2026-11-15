"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { InfiniteMediaResults } from "@/modules/media";
import { routes } from "@/shared/config/routes";
import { type MediaSummary, type MediaType, type Paged } from "@/shared/lib/tmdb/types";
import { Spinner } from "@/shared/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useDiscoverInfinite } from "../hooks/useDiscoverInfinite";
import {
  BROWSE_TABS,
  type BrowseState,
  type CatalogFilters as Filters,
  parseMediaTypeParam,
  switchMediaType,
  toBrowseSearchString,
} from "../model/filters";
import { type Genre } from "../model/genres";
import { CatalogFilters } from "./CatalogFilters";

type Props = {
  readonly state: BrowseState;
  readonly genres: Readonly<Record<MediaType, ReadonlyArray<Genre>>>;
  readonly initialPage: Paged<MediaSummary>;
};

/**
 * Single browse page with Movies / Series tabs. State lives in the URL (shareable, back/forward
 * work); the server renders page 1 for each state, the client only loads page 2+.
 */
export function CatalogBrowser({ state, genres, initialPage }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const query = useDiscoverInfinite(state.mediaType, state.filters, initialPage);

  const navigate = useCallback(
    (next: BrowseState) => {
      const search = toBrowseSearchString(next);
      // Transition: keep the current grid visible (with a spinner) until the new page is ready.
      startTransition(() => {
        router.replace(search ? `${routes.browse()}?${search}` : routes.browse(), {
          scroll: false,
        });
      });
    },
    [router],
  );

  const handleTabChange = (value: string) =>
    navigate(switchMediaType(state, parseMediaTypeParam(value)));
  const handleFiltersChange = (filters: Filters) => navigate({ ...state, filters });

  return (
    <Tabs value={state.mediaType} onValueChange={handleTabChange} className="gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList aria-label="Media type">
          {BROWSE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-4">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <CatalogFilters
          filters={state.filters}
          genres={genres[state.mediaType]}
          onChange={handleFiltersChange}
        />
      </div>

      <TabsContent value={state.mediaType} className="relative">
        {isPending && (
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-24">
            <Spinner className="size-8" label="Updating results" />
          </div>
        )}
        <div
          className={isPending ? "pointer-events-none opacity-50 transition-opacity" : undefined}
        >
          <InfiniteMediaResults query={query} emptyMessage="No titles match these filters." />
        </div>
      </TabsContent>
    </Tabs>
  );
}
