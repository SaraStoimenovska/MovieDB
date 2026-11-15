"use client";

import { useLibraryCrossTabSync } from "../hooks/useLibrary";

/** Mount once (in the app providers) to keep the library in sync across browser tabs. */
export function LibrarySync() {
  useLibraryCrossTabSync();
  return null;
}
