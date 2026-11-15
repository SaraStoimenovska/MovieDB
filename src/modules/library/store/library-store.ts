"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type BackupSource } from "@/shared/lib/backup";
import { persistedStoreOptions } from "@/shared/lib/storage";
import { type MediaKey, type MediaSummary } from "@/shared/lib/tmdb/types";
import {
  EMPTY_LIBRARY,
  LIBRARY_STORAGE_KEY,
  LIBRARY_VERSION,
  type LibraryData,
  libraryDataSchema,
  type MediaExtras,
  migrateLibrary,
  addAllToWatchList,
  removeFromLibrary,
  setRating,
  setWatchStatus,
  toggleFavorite,
  type WatchStatus,
} from "../model/library";

type LibraryActions = {
  readonly toggleFavorite: (media: MediaSummary, extras?: MediaExtras) => void;
  readonly setStatus: (
    media: MediaSummary,
    status: WatchStatus | null,
    extras?: MediaExtras,
  ) => void;
  readonly setRating: (media: MediaSummary, rating: number | null, extras?: MediaExtras) => void;
  readonly remove: (key: MediaKey) => void;
  readonly addAllToWatchList: (media: ReadonlyArray<MediaSummary>) => void;
};

export type LibraryStore = LibraryData & LibraryActions;

/**
 * Favorites, watch status and personal ratings, persisted to localStorage
 * (`mdb:library`, versioned with migrations, zod-validated). Actions are one-liners:
 * all logic lives in the pure reducers of `model/library`.
 */
export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      ...EMPTY_LIBRARY,
      toggleFavorite: (media, extras) =>
        set((state) => toggleFavorite(state, media, Date.now(), extras)),
      setStatus: (media, status, extras) =>
        set((state) => setWatchStatus(state, media, status, Date.now(), extras)),
      setRating: (media, rating, extras) =>
        set((state) => setRating(state, media, rating, Date.now(), extras)),
      remove: (key) => set((state) => removeFromLibrary(state, key)),
      addAllToWatchList: (media) => set((state) => addAllToWatchList(state, media, Date.now())),
    }),
    persistedStoreOptions<LibraryStore, LibraryData>({
      name: LIBRARY_STORAGE_KEY,
      version: LIBRARY_VERSION,
      schema: libraryDataSchema,
      pick: (state) => ({ entries: state.entries }),
      migrate: migrateLibrary,
    }),
  ),
);

/** Backup/restore hook-up for the Preferences page. */
export const libraryBackup: BackupSource<LibraryData> = {
  key: LIBRARY_STORAGE_KEY,
  label: "Favorites, lists and ratings",
  schema: libraryDataSchema,
  read: () => ({ entries: useLibraryStore.getState().entries }),
  write: (data) => useLibraryStore.setState(data),
  clear: () => useLibraryStore.setState(EMPTY_LIBRARY),
};
