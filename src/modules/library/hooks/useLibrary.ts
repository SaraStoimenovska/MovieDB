"use client";

import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import {
  EMPTY_LIBRARY,
  LIBRARY_STORAGE_KEY,
  type LibraryData,
  type LibraryEntry,
  selectCounts,
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

export const useLibraryCounts = () => selectCounts(useLibraryData().data);

export const useLibraryActions = () =>
  useLibraryStore(
    useShallow((state) => ({
      toggleFavorite: state.toggleFavorite,
      setStatus: state.setStatus,
      remove: state.remove,
    })),
  );

/** Keeps several open tabs in sync: another tab's write re-hydrates this one. */
export const useLibraryCrossTabSync = () => {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LIBRARY_STORAGE_KEY) void useLibraryStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
};
