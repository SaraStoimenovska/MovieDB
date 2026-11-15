"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useEpisodesData } from "@/modules/episodes";
import { useLibraryData, WatchStatus } from "@/modules/library";
import { tmdbProxyGet } from "@/shared/lib/tmdb/browser";
import { MediaType } from "@/shared/lib/tmdb/types";
import {
  episodeItems,
  groupUpcoming,
  type ListedTitle,
  parseNextEpisode,
  releaseItems,
  showsToCheck,
  toIsoDay,
} from "../model/upcoming";

const upcomingKeys = {
  nextEpisode: (id: number) => ["upcoming", "next-episode", id] as const,
};

/**
 * Everything coming up from your list: release dates come from the saved library; each series
 * costs one cached proxy request for its next episode. `ready` is false until local data has
 * hydrated (server HTML shows a spinner, no mismatch).
 */
export const useUpcoming = () => {
  const library = useLibraryData();
  const episodes = useEpisodesData();
  const ready = library.ready && episodes.ready;

  const titles = useMemo<ReadonlyArray<ListedTitle>>(
    () =>
      Object.values(library.data.entries).map((entry) => ({
        media: entry.media,
        watched: entry.status === WatchStatus.Watched,
        updatedAt: entry.updatedAt,
      })),
    [library.data],
  );

  const shows = useMemo(
    () =>
      showsToCheck(
        titles,
        Object.values(episodes.data.shows).map((progress) => ({
          media: { ...progress.show, mediaType: MediaType.Tv },
          updatedAt: progress.updatedAt,
        })),
      ),
    [titles, episodes.data],
  );

  // `combine` keeps a stable result object while the queries don't change.
  const next = useQueries({
    queries: shows.map((show) => ({
      queryKey: upcomingKeys.nextEpisode(show.id),
      queryFn: async ({ signal }: { readonly signal: AbortSignal }) =>
        parseNextEpisode(await tmdbProxyGet(`tv/${show.id}`, {}, signal)),
      enabled: ready,
    })),
    combine: (results) => ({
      episodes: results.map((result) => result.data ?? null),
      pending: results.some((result) => result.isPending),
      failed: results.filter((result) => result.isError).length,
    }),
  });

  const sections = useMemo(() => {
    if (!ready) return [];
    const today = toIsoDay(new Date());
    return groupUpcoming(
      [
        ...releaseItems(titles, today),
        ...episodeItems(
          shows.map((media, index) => ({ media, next: next.episodes[index] ?? null })),
          today,
        ),
      ],
      today,
    );
  }, [ready, titles, shows, next.episodes]);

  return {
    ready,
    loading: ready && next.pending,
    failed: next.failed,
    sections,
  } as const;
};
