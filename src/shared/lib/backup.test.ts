import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { APP_NAME } from "@/shared/config/app";
import {
  BACKUP_FORMAT_VERSION,
  type BackupSource,
  backupFileName,
  buildBackup,
  parseBackup,
} from "@/shared/lib/backup";

const makeSource = (key: string, data: { readonly n: number }): BackupSource<{ n: number }> => ({
  key,
  label: `Label ${key}`,
  schema: z.object({ n: z.number() }),
  read: () => data,
  write: vi.fn(),
  clear: vi.fn(),
});

const now = new Date("2026-11-15T10:00:00Z");

describe("buildBackup", () => {
  it("collects every source under its key with metadata", () => {
    const backup = buildBackup([makeSource("a", { n: 1 }), makeSource("b", { n: 2 })], now);
    expect(backup).toEqual({
      app: APP_NAME,
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: "2026-11-15T10:00:00.000Z",
      data: { a: { n: 1 }, b: { n: 2 } },
    });
  });
});

describe("parseBackup", () => {
  const sources = [makeSource("a", { n: 0 }), makeSource("b", { n: 0 })];
  const file = (data: Record<string, unknown>) =>
    JSON.stringify({ app: APP_NAME, formatVersion: BACKUP_FORMAT_VERSION, exportedAt: "x", data });

  it("round-trips a built backup", () => {
    const text = JSON.stringify(buildBackup([makeSource("a", { n: 7 })], now));
    const result = parseBackup(text, sources);
    expect(result.ok && result.plan.valid.map((v) => [v.source.key, v.data])).toEqual([
      ["a", { n: 7 }],
    ]);
  });

  it("rejects invalid JSON", () => {
    expect(parseBackup("{nope", sources)).toEqual({
      ok: false,
      error: "This file isn't valid JSON.",
    });
  });

  it("rejects files from other apps", () => {
    const result = parseBackup(JSON.stringify({ app: "Other", data: {} }), sources);
    expect(result.ok).toBe(false);
  });

  it("skips invalid sections and reports them, keeping valid ones", () => {
    const result = parseBackup(file({ a: { n: 1 }, b: { n: "bad" } }), sources);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.valid.map((v) => v.source.key)).toEqual(["a"]);
    expect(result.plan.invalid).toEqual(["Label b"]);
  });

  it("ignores sections the app doesn't know", () => {
    const result = parseBackup(file({ unknown: { n: 1 } }), sources);
    expect(result.ok && result.plan).toEqual({ valid: [], invalid: [] });
  });
});

describe("backupFileName", () => {
  it("includes the app and the date", () => {
    expect(backupFileName(now)).toBe("moviedb-backup-2026-11-15.json");
  });
});
