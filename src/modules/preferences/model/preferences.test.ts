import { describe, expect, it } from "vitest";
import { APP_REGION } from "@/shared/config/app";
import { deepFreeze } from "@/test/fixtures";
import {
  DEFAULT_PREFERENCES,
  DISPLAY_NAME_MAX_LENGTH,
  LibraryView,
  migratePreferences,
  PREFERENCES_VERSION,
  preferencesSchema,
  setDisplayName,
  setLibraryView,
  setRegion,
} from "./preferences";
import { isTheme, Theme, THEME_LABELS, THEMES } from "./theme";

const prefs = deepFreeze(DEFAULT_PREFERENCES);

describe("preferences", () => {
  it("defaults to no name, the app region and the grid view", () => {
    expect(DEFAULT_PREFERENCES).toEqual({
      displayName: "",
      region: APP_REGION,
      libraryView: LibraryView.Grid,
    });
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

  it("migrates v1 (name only) by adding the default region and view", () => {
    expect(migratePreferences({ displayName: "Sam" }, 1)).toEqual({
      displayName: "Sam",
      region: APP_REGION,
      libraryView: LibraryView.Grid,
    });
    expect(migratePreferences("junk", 1)).toEqual(DEFAULT_PREFERENCES);
    expect(preferencesSchema.safeParse(migratePreferences({ displayName: "Sam" }, 1)).success).toBe(
      true,
    );
  });

  it("migrates v2 (name + region) by adding the default view", () => {
    expect(migratePreferences({ displayName: "A", region: "FR" }, 2)).toEqual({
      displayName: "A",
      region: "FR",
      libraryView: LibraryView.Grid,
    });
    // Invalid old data (here: the region) resets to the defaults, like before.
    expect(migratePreferences({ displayName: "A", region: "nope" }, 2)).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it("sets the library view, keeping the same object when unchanged", () => {
    const prefs = DEFAULT_PREFERENCES;
    expect(setLibraryView(prefs, LibraryView.List).libraryView).toBe(LibraryView.List);
    expect(setLibraryView(prefs, LibraryView.Grid)).toBe(prefs);
  });

  it("passes current data through", () => {
    const data = { displayName: "A", region: "FR", libraryView: LibraryView.List };
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
