/** Theme preference, persisted in localStorage by next-themes under `THEME_STORAGE_KEY`. */
export const THEME_STORAGE_KEY = "mdb:theme";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Readonly<Record<Theme, string>> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export const isTheme = (value: unknown): value is Theme =>
  typeof value === "string" && (THEMES as ReadonlyArray<string>).includes(value);
