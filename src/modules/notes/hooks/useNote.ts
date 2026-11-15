"use client";

import { useHydrated } from "@/shared/hooks/useHydrated";
import { useRehydrateOnStorage } from "@/shared/hooks/useRehydrateOnStorage";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import { NOTES_STORAGE_KEY, type NoteEntry, selectNote } from "../model/notes";
import { useNotesStore } from "../store/notes-store";

/** The note for one title; `null` before hydration (matches server HTML) or when none exists. */
export const useNote = (
  key: MediaKey,
): { readonly note: NoteEntry | null; readonly ready: boolean } => {
  const ready = useHydrated();
  const note = useNotesStore((state) => selectNote(state, key));
  return { note: ready ? note : null, ready };
};

export const useNoteActions = () => ({
  save: useNotesStore((state) => state.save),
  remove: useNotesStore((state) => state.remove),
});

export const useNotesCrossTabSync = () =>
  useRehydrateOnStorage(NOTES_STORAGE_KEY, useNotesStore.persist.rehydrate);

/** Number of titles with a note (0 until hydrated). */
export const useNotesCount = (): number => {
  const ready = useHydrated();
  const count = useNotesStore((state) => Object.keys(state.entries).length);
  return ready ? count : 0;
};
