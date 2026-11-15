"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type BackupSource } from "@/shared/lib/backup";
import { persistedStoreOptions } from "@/shared/lib/storage";
import {
  EMPTY_EPISODES,
  type EpisodeRef,
  EPISODES_STORAGE_KEY,
  EPISODES_VERSION,
  type EpisodesData,
  episodesDataSchema,
  type SeasonInfo,
  setSeasonWatched,
  type ShowRef,
  toggleEpisode,
} from "../model/episodes";

type EpisodesStore = EpisodesData & {
  readonly toggle: (
    show: ShowRef,
    seasons: ReadonlyArray<SeasonInfo>,
    ref: EpisodeRef,
    runtimeMinutes: number | null,
  ) => void;
  readonly setSeason: (
    show: ShowRef,
    seasons: ReadonlyArray<SeasonInfo>,
    season: number,
    episodes: ReadonlyArray<{ readonly number: number; readonly runtimeMinutes: number | null }>,
    watched: boolean,
  ) => void;
};

export const useEpisodesStore = create<EpisodesStore>()(
  persist(
    (set) => ({
      ...EMPTY_EPISODES,
      toggle: (show, seasons, ref, runtime) =>
        set((state) => toggleEpisode(state, show, seasons, ref, runtime, Date.now())),
      setSeason: (show, seasons, season, episodes, watched) =>
        set((state) =>
          setSeasonWatched(state, show, seasons, season, episodes, watched, Date.now()),
        ),
    }),
    persistedStoreOptions<EpisodesStore, EpisodesData>({
      name: EPISODES_STORAGE_KEY,
      version: EPISODES_VERSION,
      schema: episodesDataSchema,
      pick: (state) => ({ shows: state.shows }),
    }),
  ),
);

export const episodesBackup: BackupSource<EpisodesData> = {
  key: EPISODES_STORAGE_KEY,
  label: "Episode progress",
  schema: episodesDataSchema,
  read: () => ({ shows: useEpisodesStore.getState().shows }),
  write: (data) => useEpisodesStore.setState(data),
  clear: () => useEpisodesStore.setState(EMPTY_EPISODES),
};
