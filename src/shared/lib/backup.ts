import { z } from "zod";
import { APP_NAME } from "@/shared/config/app";

/**
 * Backup/restore of everything the app stores in localStorage. Each feature module exposes a
 * `BackupSource` for its store; the Preferences page combines them. Pure functions here build
 * and validate the file, so a corrupt or foreign file can never put bad data into a store.
 */
export type BackupSource<D> = {
  /** localStorage key (`STORAGE_KEYS`): also the section name in the backup file. */
  readonly key: string;
  /** Human label, shown when reporting what was restored. */
  readonly label: string;
  readonly schema: z.ZodType<D>;
  readonly read: () => D;
  readonly write: (data: D) => void;
  readonly clear: () => void;
};

// Sources hold different data types; the array is heterogeneous by design.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBackupSource = BackupSource<any>;

export const BACKUP_FORMAT_VERSION = 1;

const backupFileSchema = z.object({
  app: z.literal(APP_NAME),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export type BackupFile = z.infer<typeof backupFileSchema>;

export const buildBackup = (sources: ReadonlyArray<AnyBackupSource>, now: Date): BackupFile => ({
  app: APP_NAME,
  formatVersion: BACKUP_FORMAT_VERSION,
  exportedAt: now.toISOString(),
  data: Object.fromEntries(sources.map((source) => [source.key, source.read()])),
});

type RestorePlan = {
  /** Validated sections, ready to write. */
  readonly valid: ReadonlyArray<{ readonly source: AnyBackupSource; readonly data: unknown }>;
  /** Labels of sections present in the file but invalid (skipped). */
  readonly invalid: ReadonlyArray<string>;
};

export type ParseBackupResult =
  | { readonly ok: true; readonly plan: RestorePlan }
  | { readonly ok: false; readonly error: string };

/** File text → what can be restored. Never throws. */
export const parseBackup = (
  text: string,
  sources: ReadonlyArray<AnyBackupSource>,
): ParseBackupResult => {
  const json = (() => {
    try {
      return { ok: true as const, value: JSON.parse(text) as unknown };
    } catch {
      return { ok: false as const };
    }
  })();
  if (!json.ok) return { ok: false, error: "This file isn't valid JSON." };

  const file = backupFileSchema.safeParse(json.value);
  if (!file.success) return { ok: false, error: `This isn't a ${APP_NAME} backup file.` };

  const sections = sources.filter((source) => source.key in file.data.data);
  const checked = sections.map((source) => ({
    source,
    parsed: source.schema.safeParse(file.data.data[source.key]),
  }));

  return {
    ok: true,
    plan: {
      valid: checked
        .filter((entry) => entry.parsed.success)
        .map((entry) => ({ source: entry.source, data: entry.parsed.data })),
      invalid: checked.filter((entry) => !entry.parsed.success).map((entry) => entry.source.label),
    },
  };
};

export const backupFileName = (now: Date): string =>
  `${APP_NAME.toLowerCase()}-backup-${now.toISOString().slice(0, 10)}.json`;
