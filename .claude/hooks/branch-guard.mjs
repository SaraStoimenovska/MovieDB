// PreToolUse (Edit|Write|MultiEdit|NotebookEdit): always work on a branch.
// Editing files of this repo while `main` is checked out is blocked; create a branch first
// (`git switch -c <type>/<topic>`, which asks the user via git-guard).
import { relative } from "node:path";
import { decide, git, projectDir, readInput } from "./lib.mjs";

const MAIN = "main";
const input = readInput();
const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!file) process.exit(0);

// Only files inside the repo (memory, plans and scratchpad live elsewhere).
const rel = relative(projectDir, file);
if (rel.startsWith("..") || /^[a-zA-Z]:/.test(rel)) process.exit(0);

if (git("rev-parse", "--abbrev-ref", "HEAD") === MAIN) {
  decide(
    "deny",
    `Don't edit files on \`${MAIN}\`. First create a work branch: ` +
      "`git switch -c <type>/<short-topic>` (e.g. `fix/search-hint`); the user approves it.",
  );
}
process.exit(0);
