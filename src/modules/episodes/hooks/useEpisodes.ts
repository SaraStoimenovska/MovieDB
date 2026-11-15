"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { useRehydrateOnStorage } from "@/shared/hooks/useRehydrateOnStorage";
import { tmdbProxyGet } from "@/shared/lib/tmdb/browser";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import {
  EMPTY_EPISODES,
  EPISODES_STORAGE_KEY,
  type EpisodesData,
  type ShowProgress,
} from "../model/episodes";
import { parseSeasonEpisodes, seasonKeys } from "../model/season";
import { useEpisodesStore } from "../store/episodes-store";

/** All tracked shows; empty before hydration (matches the server HTML). */
export const useEpisodesData = (): { readonly data: EpisodesData; readonly ready: boolean } => {
  const ready = useHydrated();
  const shows = useEpisodesStore((state) => state.shows);
  return useMemo(() => ({ data: ready ? { shows } : EMPTY_EPISODES, ready }), [shows, ready]);
};

export const useShowProgress = (key: MediaKey): ShowProgress | null => {
  const { data } = useEpisodesData();
  return data.shows[key] ?? null;
};

export const useEpisodeActions = () => ({
  toggle: useEpisodesStore((state) => state.toggle),
  setSeason: useEpisodesStore((state) => state.setSeason),
});

/** Episodes of one season, fetched through the cached proxy when a season is expanded. */
export const useSeasonEpisodes = (tvId: number, season: number, enabled: boolean) =>
  useQuery({
    queryKey: seasonKeys.season(tvId, season),
    queryFn: async ({ signal }) =>
      parseSeasonEpisodes(await tmdbProxyGet(`tv/${tvId}/season/${season}`, {}, signal)),
    enabled,
  });

export const useEpisodesCrossTabSync = () =>
  useRehydrateOnStorage(EPISODES_STORAGE_KEY, useEpisodesStore.persist.rehydrate);
