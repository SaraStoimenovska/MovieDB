"use client";

import { episodesBackup } from "@/modules/episodes";
import { libraryBackup } from "@/modules/library";
import { notesBackup } from "@/modules/notes";
import { DataManagement, preferencesBackup } from "@/modules/preferences";
import { commentsBackup, reviewsBackup } from "@/modules/reviews";
import { type AnyBackupSource } from "@/shared/lib/backup";

/**
 * The app decides which stores are part of a backup. (Client module: sources wrap the
 * browser stores, so they can't be passed from a Server Component.)
 */
const BACKUP_SOURCES: ReadonlyArray<AnyBackupSource> = [
  libraryBackup,
  episodesBackup,
  notesBackup,
  reviewsBackup,
  commentsBackup,
  preferencesBackup,
];

export function AppDataManagement() {
  return <DataManagement sources={BACKUP_SOURCES} />;
}
