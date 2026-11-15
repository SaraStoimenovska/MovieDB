import { STORAGE_KEYS } from "@/shared/config/storage-keys";

/** Theme preference, persisted in localStorage by next-themes under `THEME_STORAGE_KEY`. */
export const THEME_STORAGE_KEY = STORAGE_KEYS.theme;

export const Theme = { Light: "light", Dark: "dark", System: "system" } as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const THEMES: ReadonlyArray<Theme> = Object.values(Theme);

/** Follow the OS until the user picks a theme. */
export const DEFAULT_THEME: Theme = Theme.System;

export const THEME_LABELS: Readonly<Record<Theme, string>> = {
  [Theme.Light]: "Light",
  [Theme.Dark]: "Dark",
  [Theme.System]: "System",
};

export const isTheme = (value: unknown): value is Theme =>
  typeof value === "string" && (THEMES as ReadonlyArray<string>).includes(value);
