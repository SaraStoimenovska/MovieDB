---
name: ship
description: This project's git workflow — work on a branch, commit there after a fresh build, hand over for the user to test, then merge into main and push only with the user's approval. Use when starting work (create the branch), when work is done (commit + hand over), and when the user approves merging/pushing.
---

# Ship

Enforced by hooks: `branch-guard.mjs` (no edits on `main`) and `git-guard.mjs` (every git
command that changes something asks the user; read-only ones don't).
Never `--no-verify`, force push or `reset --hard`. Only `main` is ever pushed.

## A. Start of a task

1. `git status` — if there are uncommitted changes that aren't yours, ask the user what to do.
2. Create the work branch from `main`: `git switch -c <type>/<short-topic>`
   (`feat/person-pages`, `fix/where-to-watch-links`, `chore/claude-hooks`). The user approves.
   If a branch for this task already exists, switch to it instead.

## B. Work is done → commit on the branch, hand over

1. Run the `verify` skill (at least `pnpm check` + `pnpm build`; the guard denies commits when a
   changed source file is newer than `.next/BUILD_ID`).
2. `node .claude/hooks/scan-secrets.mjs` must print OK.
3. Review `git status --short` / `git diff --stat`: nothing unexpected (`.env*`, `test-results/`,
   `tests/e2e/zz-*.spec.ts`, scratch files).
4. `git add -A && git commit` with a conventional message (commitlint enforces it):
   ```
   <type>(<optional scope>): <imperative summary, ≤ 72 chars>

   - what changed and why, one line per notable change

   Co-Authored-By: <the attribution line from the current session's instructions>
   ```
   The pre-commit hook takes minutes on big commits: run it in the background. If it fails, fix
   the files and commit again.
5. **Stop and hand over**: tell the user the branch name, what to test (pages, steps), and how
   (`pnpm build && pnpm start`, or `pnpm dev`). Don't merge.

## C. User tested and approved → merge and push

Only after the user explicitly says the branch is OK to merge:

1. `git switch main && git merge --ff-only <branch>` (asks). If not fast-forward, ask the user.
2. `git push origin main` (asks). If credentials fail, tell the user to run it themselves.
3. `git branch -d <branch>` (asks).

Report: commit hash and subject, merged/pushed or not, and that Vercel redeploys from `main`.
