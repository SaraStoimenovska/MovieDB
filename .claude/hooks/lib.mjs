// Shared helpers for the project's Claude Code hooks (see .claude/settings.json).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

/** Hook payload (JSON on stdin). */
export const readInput = () => {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
};

/** Runs a command through the shell (needed for pnpm.cmd on Windows); args are quoted. */
export const run = (command, args = [], options = {}) => {
  const quoted = args.map((arg) => `"${String(arg).replaceAll('"', '\\"')}"`).join(" ");
  const result = spawnSync(`${command} ${quoted}`, {
    cwd: projectDir,
    shell: true,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  return {
    code: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
};

export const git = (...args) => run("git", args).output;

/** PreToolUse decision: "deny" blocks the tool call, "ask" forces a confirmation prompt. */
export const decide = (permissionDecision, reason) => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision,
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
};

/** Last lines of a long output, for messages. */
export const tail = (text, lines = 25) => text.split(/\r?\n/).slice(-lines).join("\n");
