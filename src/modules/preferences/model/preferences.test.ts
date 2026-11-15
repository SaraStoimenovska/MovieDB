import { describe, expect, it } from "vitest";
import { APP_REGION } from "@/shared/config/app";
import { deepFreeze } from "@/test/fixtures";
import {
  DEFAULT_PREFERENCES,
  DISPLAY_NAME_MAX_LENGTH,
  migratePreferences,
  PREFERENCES_VERSION,
  preferencesSchema,
  setDisplayName,
  setRegion,
} from "./preferences";
import { isTheme, Theme, THEME_LABELS, THEMES } from "./theme";

const prefs = deepFreeze(DEFAULT_PREFERENCES);

describe("preferences", () => {
  it("defaults to no name and the app region", () => {
    expect(DEFAULT_PREFERENCES).toEqual({ displayName: "", region: APP_REGION });
  });

  it("trims and caps the display name", () => {
    expect(setDisplayName(prefs, "  Sam  ").displayName).toBe("Sam");
    expect(setDisplayName(prefs, "x".repeat(99)).displayName).toHaveLength(DISPLAY_NAME_MAX_LENGTH);
  });

  it.each([
    ["DE", "DE"],
    ["de", APP_REGION],
    ["USA", APP_REGION],
  ])("setRegion(%s) → %s", (input, expected) => {
    expect(setRegion(prefs, input).region).toBe(expected);
  });

  it("migrates v1 (name only) by adding the default region", () => {
    expect(migratePreferences({ displayName: "Sam" }, 1)).toEqual({
      displayName: "Sam",
      region: APP_REGION,
    });
    expect(migratePreferences("junk", 1)).toEqual(DEFAULT_PREFERENCES);
    expect(preferencesSchema.safeParse(migratePreferences({ displayName: "Sam" }, 1)).success).toBe(
      true,
    );
  });

  it("passes current data through", () => {
    const data = { displayName: "A", region: "FR" };
    expect(migratePreferences(data, PREFERENCES_VERSION)).toBe(data);
  });
});

describe("theme", () => {
  it("has a label for every theme", () => {
    THEMES.forEach((theme) => expect(THEME_LABELS[theme]).toBeTruthy());
  });

  it.each([
    [Theme.Dark, true],
    ["sepia", false],
    [undefined, false],
  ])("isTheme(%j) → %s", (value, expected) => {
    expect(isTheme(value)).toBe(expected);
  });
});
