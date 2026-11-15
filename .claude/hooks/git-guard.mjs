// PreToolUse (Bash|PowerShell): the project's git workflow.
//   1. Always work on a branch (edits on main are blocked by branch-guard.mjs).
//   2. When done: commit on the branch (fresh prod build first). The user tests it.
//   3. The user approves the merge into main and the push of main.
//   4. Every git command that changes anything asks the user first; read-only ones don't.
// Never: --no-verify, force push, reset --hard, committing on main, pushing other branches.
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { decide, git, projectDir, readInput } from "./lib.mjs";

const MAIN = "main";
const command = String(readInput().tool_input?.command ?? "");
if (!/\bgit\b/.test(command)) process.exit(0);

// One entry per git invocation: segments (split on && ; || | and newlines) that START with git,
// optionally after `VAR=value` prefixes or `(`/`{`. "git push" inside a quoted string or a
// sed/echo argument is not a git invocation.
const segments = command
  .split(/&&|\|\||;|\||\r?\n/)
  .map((part) => part.trim().replace(/^[({!\s]+/, ""))
  .filter((part) => /^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*git(?:\.exe)?\s/.test(`${part} `));
if (segments.length === 0) process.exit(0);
const sub = (segment) => segment.match(/\bgit(?:\.exe)?\s+(?:-C\s+\S+\s+)?([a-z-]+)/)?.[1] ?? "";
const has = (name) => segments.some((segment) => sub(segment) === name);
const gitText = segments.join(" ; ");
const createsBranchFirst = /\b(switch\s+-c|checkout\s+-b)\b/.test(gitText);
const currentBranch = () => git("rev-parse", "--abbrev-ref", "HEAD");

// ---------- hard rules (denied, never asked) ----------
if (/--no-verify\b/.test(gitText)) {
  decide("deny", "Don't skip git hooks (--no-verify). Fix what the pre-commit hook reports.");
}
if (
  segments.some((s) => sub(s) === "push" && /(\s--force(-with-lease)?\b|\s-f\b|\s\+\S)/.test(s))
) {
  decide("deny", "Force-pushing is not allowed.");
}
if (segments.some((s) => sub(s) === "reset" && /--hard\b/.test(s))) {
  decide("deny", "`git reset --hard` discards work. Use `git stash` (asks the user) instead.");
}

if (has("push")) {
  const pushSegment = segments.find((s) => sub(s) === "push") ?? "";
  const targets = pushSegment
    .replace(/^.*?\bpush\b/, "")
    // Drop shell redirects (`2>&1`, `> log`, `>> log`, `< in`): they aren't refspecs.
    .replace(/\s\d*(>>?|<)&?\s*\S*/g, " ")
    .split(/\s+/)
    .filter((token) => token && !token.startsWith("-"));
  const refspecs = targets.slice(1); // targets[0] is the remote
  const pushesOnlyMain =
    refspecs.length > 0
      ? refspecs.every((ref) => ref === MAIN || ref === `HEAD:${MAIN}` || ref.endsWith(`:${MAIN}`))
      : currentBranch() === MAIN;
  if (!pushesOnlyMain) {
    decide(
      "deny",
      `Only \`${MAIN}\` is pushed, after the user tested the branch and approved the merge.`,
    );
  }
}

if (has("commit")) {
  if (currentBranch() === MAIN && !createsBranchFirst) {
    decide("deny", `Don't commit on ${MAIN}. Commit on the work branch; ${MAIN} only gets merges.`);
  }
  // A production build newer than every changed file that ends up in the build.
  const buildId = join(projectDir, ".next", "BUILD_ID");
  const builtAt = existsSync(buildId) ? statSync(buildId).mtimeMs : 0;
  const stale = git("status", "--porcelain")
    .split(/\r?\n/)
    .map((line) =>
      line
        .slice(3)
        .replace(/^.* -> /, "")
        .replace(/^"|"$/g, ""),
    )
    .filter(Boolean)
    .filter((file) => !/(^\.claude\/|^tests\/|\.test\.tsx?$|\.md$|^src\/test\/)/.test(file))
    .map((file) => join(projectDir, file))
    .filter((file) => existsSync(file) && statSync(file).isFile())
    .filter((file) => statSync(file).mtimeMs > builtAt);
  if (stale.length > 0) {
    decide(
      "deny",
      `Run the production build first (\`pnpm build\`): ${stale.length} changed file(s) are newer ` +
        `than the last build${builtAt ? "" : " (no build found)"}. Then commit again.`,
    );
  }
}

// ---------- read-only git commands run without asking ----------
const READ_ONLY = new Set([
  "status",
  "diff",
  "log",
  "show",
  "rev-parse",
  "ls-files",
  "grep",
  "blame",
  "describe",
  "shortlog",
  "check-ignore",
  "cat-file",
  "merge-base",
  "name-rev",
]);
const isReadOnly = (segment) => {
  const name = sub(segment);
  if (READ_ONLY.has(name)) return true;
  // `git branch` / `git branch -a|-v|--list|--show-current` only list branches.
  if (name === "branch") {
    const args = segment.replace(/^.*?\bbranch\b/, "").trim();
    return args === "" || /^(-a|-r|-v|-vv|--list|--show-current|--all)(\s|$)/.test(args);
  }
  if (name === "remote") return /\bremote(\s+-v)?\s*$/.test(segment);
  if (name === "stash") return /\bstash\s+(list|show)\b/.test(segment);
  if (name === "config") return /\s--(get|list)\b/.test(segment);
  return false;
};

const changing = segments.filter((segment) => !isReadOnly(segment));
if (changing.length === 0) process.exit(0);

// ---------- everything else asks, with a clear description ----------
const describe = (segment) => {
  const name = sub(segment);
  const branch = currentBranch();
  if (name === "commit") {
    const staged = git("diff", "--cached", "--shortstat") || "nothing staged yet";
    return `commit on \`${createsBranchFirst ? "a new branch" : branch}\` (${staged})`;
  }
  if (name === "merge") return `merge into \`${branch}\`${branch === MAIN ? " (main!)" : ""}`;
  if (name === "push") return `push \`${MAIN}\` to GitHub`;
  return segment.length > 80 ? `${segment.slice(0, 77)}…` : segment;
};

decide("ask", `Git action needs your OK: ${changing.map(describe).join("; ")}`);
