"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { type BackupSource } from "@/shared/lib/backup";
import { persistedStoreOptions } from "@/shared/lib/storage";
import {
  DEFAULT_PREFERENCES,
  type LibraryView,
  migratePreferences,
  PREFERENCES_STORAGE_KEY,
  PREFERENCES_VERSION,
  type PreferencesData,
  preferencesSchema,
  setDisplayName,
  setLibraryView,
  setRegion,
} from "../model/preferences";

type PreferencesStore = PreferencesData & {
  readonly setDisplayName: (name: string) => void;
  readonly setRegion: (region: string) => void;
  readonly setLibraryView: (view: LibraryView) => void;
};

const pick = (state: PreferencesData): PreferencesData => ({
  displayName: state.displayName,
  region: state.region,
  libraryView: state.libraryView,
});

const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setDisplayName: (name) => set((state) => setDisplayName(state, name)),
      setRegion: (region) => set((state) => setRegion(state, region)),
      setLibraryView: (view) => set((state) => setLibraryView(state, view)),
    }),
    persistedStoreOptions<PreferencesStore, PreferencesData>({
      name: PREFERENCES_STORAGE_KEY,
      version: PREFERENCES_VERSION,
      schema: preferencesSchema,
      pick,
      migrate: migratePreferences,
    }),
  ),
);

/** Remembered author name for reviews and comments ("" until hydrated or never set). */
export const useDisplayName = () => {
  const ready = useHydrated();
  const displayName = usePreferencesStore((state) => state.displayName);
  const update = usePreferencesStore((state) => state.setDisplayName);
  return {
    displayName: ready ? displayName : DEFAULT_PREFERENCES.displayName,
    setDisplayName: update,
  } as const;
};

/** Region for "Where to watch" (the app default until hydrated, matching the server HTML). */
export const useRegion = () => {
  const ready = useHydrated();
  const region = usePreferencesStore((state) => state.region);
  const update = usePreferencesStore((state) => state.setRegion);
  return { region: ready ? region : DEFAULT_PREFERENCES.region, setRegion: update, ready } as const;
};

/** Grid or list on Favorites / My list (grid until hydrated, matching the server HTML). */
export const useLibraryView = () => {
  const ready = useHydrated();
  const view = usePreferencesStore((state) => state.libraryView);
  const update = usePreferencesStore((state) => state.setLibraryView);
  return { view: ready ? view : DEFAULT_PREFERENCES.libraryView, setView: update } as const;
};

export const preferencesBackup: BackupSource<PreferencesData> = {
  key: PREFERENCES_STORAGE_KEY,
  label: "Preferences",
  schema: preferencesSchema,
  read: () => pick(usePreferencesStore.getState()),
  write: (data) => usePreferencesStore.setState(data),
  clear: () => usePreferencesStore.setState(DEFAULT_PREFERENCES),
};
