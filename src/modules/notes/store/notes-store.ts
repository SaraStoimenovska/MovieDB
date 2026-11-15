"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type BackupSource } from "@/shared/lib/backup";
import { persistedStoreOptions } from "@/shared/lib/storage";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import {
  deleteNote,
  EMPTY_NOTES,
  NOTES_STORAGE_KEY,
  NOTES_VERSION,
  type NotesData,
  notesDataSchema,
  saveNote,
} from "../model/notes";

type NotesStore = NotesData & {
  readonly save: (key: MediaKey, title: string, body: string) => void;
  readonly remove: (key: MediaKey) => void;
};

export const useNotesStore = create<NotesStore>()(
  persist(
    (set) => ({
      ...EMPTY_NOTES,
      save: (key, title, body) => set((state) => saveNote(state, key, title, body, Date.now())),
      remove: (key) => set((state) => deleteNote(state, key)),
    }),
    persistedStoreOptions<NotesStore, NotesData>({
      name: NOTES_STORAGE_KEY,
      version: NOTES_VERSION,
      schema: notesDataSchema,
      pick: (state) => ({ entries: state.entries }),
    }),
  ),
);

/** Backup/restore hook-up for the Preferences page. */
export const notesBackup: BackupSource<NotesData> = {
  key: NOTES_STORAGE_KEY,
  label: "Personal notes",
  schema: notesDataSchema,
  read: () => ({ entries: useNotesStore.getState().entries }),
  write: (data) => useNotesStore.setState(data),
  clear: () => useNotesStore.setState(EMPTY_NOTES),
};
