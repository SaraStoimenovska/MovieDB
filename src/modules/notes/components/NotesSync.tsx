"use client";

import { useNotesCrossTabSync } from "../hooks/useNote";

/** Mount once (in the app providers) to keep notes in sync across browser tabs. */
export function NotesSync() {
  useNotesCrossTabSync();
  return null;
}
