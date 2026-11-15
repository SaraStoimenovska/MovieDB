// Stop: run the unit tests related to source files changed since the last run, and warn the
// user (no blocking) if any fail. Skips quickly when nothing relevant changed.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git, projectDir, readInput, run, tail } from "./lib.mjs";

const input = readInput();
if (input.stop_hook_active) process.exit(0);

// Per-project stamp outside the repo (nothing to gitignore).
const stateDir = join(tmpdir(), "claude-hooks");
const key = projectDir.replace(/[^a-z0-9]+/gi, "_").slice(-80);
const stampFile = join(stateDir, `${key}.last-tests`);
const lastRun = existsSync(stampFile) ? Number(readFileSync(stampFile, "utf8")) || 0 : 0;

const changed = git("status", "--porcelain")
  .split(/\r?\n/)
  .map((line) =>
    line
      .slice(3)
      .replace(/^.* -> /, "")
      .replace(/^"|"$/g, ""),
  )
  .filter((file) => /^src\/.*\.(ts|tsx|mts)$/.test(file))
  .filter((file) => {
    const full = join(projectDir, file);
    return existsSync(full) && statSync(full).mtimeMs > lastRun;
  });

if (changed.length === 0) process.exit(0);

mkdirSync(stateDir, { recursive: true });
writeFileSync(stampFile, String(Date.now()));

const result = run("pnpm exec vitest related --run --reporter=dot", changed);
const message =
  result.code === 0
    ? null
    : `Tests related to ${changed.length} changed file(s) are failing:\n${tail(result.output, 30)}`;

if (message) process.stdout.write(JSON.stringify({ systemMessage: message }));
process.exit(0);
