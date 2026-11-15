import { z } from "zod";
import { APP_REGION } from "@/shared/config/app";
import { STORAGE_KEYS } from "@/shared/config/storage-keys";

export const PREFERENCES_STORAGE_KEY = STORAGE_KEYS.preferences;
/** v1: display name. v2: + watch-provider region. */
export const PREFERENCES_VERSION = 2;

/** Name shown on reviews/comments until the user types one (there are no accounts). */
const DEFAULT_DISPLAY_NAME = "";
export const DISPLAY_NAME_MAX_LENGTH = 40;

/** ISO 3166-1 alpha-2, e.g. "US", "DE". */
const REGION_PATTERN = /^[A-Z]{2}$/;

export type PreferencesData = {
  readonly displayName: string;
  /** Region for "Where to watch". */
  readonly region: string;
};

export const DEFAULT_PREFERENCES: PreferencesData = {
  displayName: DEFAULT_DISPLAY_NAME,
  region: APP_REGION,
};

export const preferencesSchema: z.ZodType<PreferencesData> = z.object({
  displayName: z.string().max(DISPLAY_NAME_MAX_LENGTH),
  region: z.string().regex(REGION_PATTERN),
});

const preferencesV1Schema = z.object({ displayName: z.string().max(DISPLAY_NAME_MAX_LENGTH) });

export const migratePreferences = (persisted: unknown, fromVersion: number): PreferencesData => {
  if (fromVersion >= PREFERENCES_VERSION) return persisted as PreferencesData;
  const v1 = preferencesV1Schema.safeParse(persisted);
  return { ...DEFAULT_PREFERENCES, ...(v1.success ? v1.data : {}) };
};

export const setDisplayName = (data: PreferencesData, name: string): PreferencesData => ({
  ...data,
  displayName: name.trim().slice(0, DISPLAY_NAME_MAX_LENGTH),
});

/** Ignores anything that isn't a 2-letter region code. */
export const setRegion = (data: PreferencesData, region: string): PreferencesData =>
  REGION_PATTERN.test(region) ? { ...data, region } : data;
