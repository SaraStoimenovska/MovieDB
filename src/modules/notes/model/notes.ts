import { z } from "zod";
import { STORAGE_KEYS } from "@/shared/config/storage-keys";
import { mediaKeySchema } from "@/shared/lib/tmdb/schemas";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import { normalizeUserText } from "@/shared/utils/text";

export const NOTES_STORAGE_KEY = STORAGE_KEYS.notes;
export const NOTES_VERSION = 1;

/** Plenty for a personal opinion, small enough to keep localStorage healthy. */
export const NOTE_MAX_LENGTH = 5000;

/** Counter turns into a warning once this close to the limit. */
export const NOTE_WARN_REMAINING = 200;

export type NoteEntry = {
  readonly body: string;
  /** Kept with the note so a future "all my notes" page can list titles without TMDB. */
  readonly title: string;
  readonly createdAt: number;
  readonly updatedAt: number;
};

export type NotesData = { readonly entries: Readonly<Record<MediaKey, NoteEntry>> };

export const EMPTY_NOTES: NotesData = { entries: {} };

const noteSchema = z.object({
  body: z.string().max(NOTE_MAX_LENGTH),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const notesDataSchema: z.ZodType<NotesData> = z.object({
  entries: z.record(mediaKeySchema, noteSchema),
});

/** What a saved note body looks like: normalized and capped. */
export const normalizeNote = (body: string): string =>
  normalizeUserText(body).slice(0, NOTE_MAX_LENGTH);

const withoutKey = (data: NotesData, key: MediaKey): NotesData => {
  const { [key]: _removed, ...rest } = data.entries;
  return { entries: rest };
};

/**
 * Saves (or, for an empty body, deletes) the note. Returns the same object when nothing
 * changed, so autosave doesn't trigger store updates / re-renders on every pause in typing.
 */
export const saveNote = (
  data: NotesData,
  key: MediaKey,
  title: string,
  body: string,
  now: number,
): NotesData => {
  const normalized = normalizeNote(body);
  const current = data.entries[key];

  if (normalized === "") return current ? withoutKey(data, key) : data;
  if (current?.body === normalized) return data;

  return {
    entries: {
      ...data.entries,
      [key]: { body: normalized, title, createdAt: current?.createdAt ?? now, updatedAt: now },
    },
  };
};

export const deleteNote = (data: NotesData, key: MediaKey): NotesData =>
  data.entries[key] ? withoutKey(data, key) : data;

export const selectNote = (data: NotesData, key: MediaKey): NoteEntry | null =>
  data.entries[key] ?? null;

/** Unsaved = the draft differs from what's stored (after normalization). */
export const hasUnsavedChanges = (draft: string, saved: NoteEntry | null): boolean =>
  normalizeNote(draft) !== (saved?.body ?? "");
