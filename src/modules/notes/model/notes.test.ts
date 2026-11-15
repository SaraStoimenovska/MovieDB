import { describe, expect, it } from "vitest";
import { deepFreeze } from "@/test/fixtures";
import {
  deleteNote,
  EMPTY_NOTES,
  hasUnsavedChanges,
  NOTE_MAX_LENGTH,
  normalizeNote,
  notesDataSchema,
  saveNote,
  selectNote,
} from "./notes";

const key = "movie:550" as const;
const empty = deepFreeze(EMPTY_NOTES);

describe("saveNote", () => {
  it("creates a note with normalized text", () => {
    const data = saveNote(empty, key, "Fight Club", "  Loved it\r\n\r\n\r\nGreat  ", 10);
    expect(selectNote(data, key)).toEqual({
      body: "Loved it\n\nGreat",
      title: "Fight Club",
      createdAt: 10,
      updatedAt: 10,
    });
  });

  it("keeps createdAt and bumps updatedAt on edits", () => {
    const first = deepFreeze(saveNote(empty, key, "T", "one", 1));
    expect(selectNote(saveNote(first, key, "T", "two", 5), key)).toMatchObject({
      createdAt: 1,
      updatedAt: 5,
    });
  });

  it("returns the same object when nothing changed (no needless store updates)", () => {
    const data = deepFreeze(saveNote(empty, key, "T", "same", 1));
    expect(saveNote(data, key, "T", "  same  ", 2)).toBe(data);
    expect(saveNote(empty, key, "T", "   ", 2)).toBe(empty);
  });

  it("deletes the note when the body becomes empty", () => {
    const data = deepFreeze(saveNote(empty, key, "T", "text", 1));
    expect(saveNote(data, key, "T", "", 2)).toEqual(EMPTY_NOTES);
  });

  it("caps the length", () => {
    const data = saveNote(empty, key, "T", "x".repeat(NOTE_MAX_LENGTH + 50), 1);
    expect(selectNote(data, key)?.body).toHaveLength(NOTE_MAX_LENGTH);
  });
});

describe("deleteNote / hasUnsavedChanges / schema", () => {
  it("deleteNote is a no-op for a missing note", () => {
    expect(deleteNote(empty, key)).toBe(empty);
  });

  it("detects unsaved drafts after normalization", () => {
    const saved = { body: "hi", title: "T", createdAt: 1, updatedAt: 1 };
    expect(hasUnsavedChanges(" hi ", saved)).toBe(false);
    expect(hasUnsavedChanges("hi!", saved)).toBe(true);
    expect(hasUnsavedChanges("", null)).toBe(false);
  });

  it("normalizeNote trims", () => {
    expect(normalizeNote("  a  ")).toBe("a");
  });

  it("validates persisted notes", () => {
    expect(notesDataSchema.safeParse(saveNote(empty, key, "T", "x", 1)).success).toBe(true);
    expect(notesDataSchema.safeParse({ entries: { [key]: { body: 1 } } }).success).toBe(false);
  });
});
