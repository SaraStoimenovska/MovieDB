import { z } from "zod";
import { APP_REGION } from "@/shared/config/app";
import { STORAGE_KEYS } from "@/shared/config/storage-keys";

export const PREFERENCES_STORAGE_KEY = STORAGE_KEYS.preferences;
/** v1: display name. v2: + watch-provider region. v3: + library view (grid/list). */
export const PREFERENCES_VERSION = 3;

/** Name shown on reviews/comments until the user types one (there are no accounts). */
const DEFAULT_DISPLAY_NAME = "";
export const DISPLAY_NAME_MAX_LENGTH = 40;

/** ISO 3166-1 alpha-2, e.g. "US", "DE". */
const REGION_PATTERN = /^[A-Z]{2}$/;

/** How Favorites / My list show titles. */
export const LibraryView = { Grid: "grid", List: "list" } as const;
export type LibraryView = (typeof LibraryView)[keyof typeof LibraryView];

export type PreferencesData = {
  readonly displayName: string;
  /** Region for "Where to watch". */
  readonly region: string;
  readonly libraryView: LibraryView;
};

export const DEFAULT_PREFERENCES: PreferencesData = {
  displayName: DEFAULT_DISPLAY_NAME,
  region: APP_REGION,
  libraryView: LibraryView.Grid,
};

export const preferencesSchema: z.ZodType<PreferencesData> = z.object({
  displayName: z.string().max(DISPLAY_NAME_MAX_LENGTH),
  region: z.string().regex(REGION_PATTERN),
  libraryView: z.enum(LibraryView),
});

/** Older versions only had a subset of the fields: keep what's valid, default the rest. */
const olderPreferencesSchema = z.object({
  displayName: z.string().max(DISPLAY_NAME_MAX_LENGTH).optional(),
  region: z.string().regex(REGION_PATTERN).optional(),
});

export const migratePreferences = (persisted: unknown, fromVersion: number): PreferencesData => {
  if (fromVersion >= PREFERENCES_VERSION) return persisted as PreferencesData;
  const older = olderPreferencesSchema.safeParse(persisted);
  const kept = older.success
    ? Object.fromEntries(Object.entries(older.data).filter(([, value]) => value !== undefined))
    : {};
  return { ...DEFAULT_PREFERENCES, ...kept };
};

export const setDisplayName = (data: PreferencesData, name: string): PreferencesData => ({
  ...data,
  displayName: name.trim().slice(0, DISPLAY_NAME_MAX_LENGTH),
});

/** Ignores anything that isn't a 2-letter region code. */
export const setRegion = (data: PreferencesData, region: string): PreferencesData =>
  REGION_PATTERN.test(region) ? { ...data, region } : data;

export const setLibraryView = (data: PreferencesData, view: LibraryView): PreferencesData =>
  data.libraryView === view ? data : { ...data, libraryView: view };
