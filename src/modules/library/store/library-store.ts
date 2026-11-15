"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeStorage, validatedMerge } from "@/shared/lib/storage";
import { type MediaKey, type MediaSummary } from "@/shared/lib/tmdb/types";
import {
  EMPTY_LIBRARY,
  LIBRARY_STORAGE_KEY,
  LIBRARY_VERSION,
  type LibraryData,
  libraryDataSchema,
  removeFromLibrary,
  setWatchStatus,
  toggleFavorite,
  type WatchStatus,
} from "../model/library";

type LibraryActions = {
  readonly toggleFavorite: (media: MediaSummary) => void;
  readonly setStatus: (media: MediaSummary, status: WatchStatus | null) => void;
  readonly remove: (key: MediaKey) => void;
};

export type LibraryStore = LibraryData & LibraryActions;

/**
 * Favorites + watch status, persisted to localStorage (`mdb:library`, versioned, zod-validated).
 * Actions are one-liners: all logic lives in the pure reducers of `model/library`.
 */
export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      ...EMPTY_LIBRARY,
      toggleFavorite: (media) => set((state) => toggleFavorite(state, media, Date.now())),
      setStatus: (media, status) =>
        set((state) => setWatchStatus(state, media, status, Date.now())),
      remove: (key) => set((state) => removeFromLibrary(state, key)),
    }),
    {
      name: LIBRARY_STORAGE_KEY,
      version: LIBRARY_VERSION,
      storage: createSafeStorage<LibraryData>(),
      partialize: (state): LibraryData => ({ entries: state.entries }),
      merge: validatedMerge(libraryDataSchema),
      // Future schema changes: bump LIBRARY_VERSION and transform old data here.
      migrate: (persisted) => persisted as LibraryData,
    },
  ),
);
