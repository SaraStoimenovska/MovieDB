"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { useRehydrateOnStorage } from "@/shared/hooks/useRehydrateOnStorage";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import {
  EMPTY_LIBRARY,
  LIBRARY_STORAGE_KEY,
  type LibraryData,
  type LibraryEntry,
  selectEntry,
} from "../model/library";
import { useLibraryStore } from "../store/library-store";

/**
 * Library data as seen by components. Before hydration it is always empty, matching the
 * server-rendered HTML (the server has no localStorage), so React never sees a mismatch.
 */
export const useLibraryData = (): { readonly data: LibraryData; readonly ready: boolean } => {
  const ready = useHydrated();
  const entries = useLibraryStore((state) => state.entries);
  return useMemo(() => ({ data: ready ? { entries } : EMPTY_LIBRARY, ready }), [entries, ready]);
};

export const useLibraryEntry = (key: MediaKey): LibraryEntry | null => {
  const { data } = useLibraryData();
  return selectEntry(data, key);
};

export const useLibraryActions = () =>
  useLibraryStore(
    useShallow((state) => ({
      toggleFavorite: state.toggleFavorite,
      setStatus: state.setStatus,
      setRating: state.setRating,
      remove: state.remove,
    })),
  );

/** Keeps several open tabs in sync: another tab's write re-hydrates this one. */
export const useLibraryCrossTabSync = () =>
  useRehydrateOnStorage(LIBRARY_STORAGE_KEY, useLibraryStore.persist.rehydrate);
