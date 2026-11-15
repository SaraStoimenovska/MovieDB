---
name: verify
description: Full verification before saying work is done or before committing — format, lint, typecheck, unit tests, production build, e2e (4 viewports + axe), knip, secret scan. Use after implementing a change, before the ship skill, or when asked to "check everything".
---

# Verify

This machine is slow: `typecheck` ~3 min, `build` ~3 min, e2e ~4 min. Run long steps with
`run_in_background` and wait for the completion notification; don't poll or sleep. Write logs to
the scratchpad and grep them, instead of streaming full output.

## Order (stop at the first failure, fix, rerun that step)

1. **Format**: `pnpm format` (Prettier, whole repo; the post-edit hook already formats edited files).
2. **Check**: `pnpm check` = lint + typecheck + unit tests. Must be green.
   Grep the log for `error|warning|FAIL|Tests |Test Files`.
3. **Build**: `pnpm build`. Needed by e2e and by the git guard before every commit. Exit 0, no
   `Error` lines. Watch for prerender errors such as `new Date()` or uncached data outside
   `connection()`/Suspense (Cache Components).
4. **E2E**: `pnpm test:e2e` (uses the fresh build; 4 viewports + axe). Expect all passed.
   If UI changed, also run the `probe` skill on the affected page and look at the screenshot.
5. **Unused code**: `pnpm knip`. Remove unused files, exports and dependencies it reports
   (or justify them).
6. **Secrets**: `node .claude/hooks/scan-secrets.mjs` (prints file names only, never the key).

## Report

Exact numbers, e.g. "lint/typecheck clean, 384 unit tests passed, build OK, 52/52 e2e passed,
knip clean, no secrets found". If something was skipped or failed, say so with the relevant
output. Never say "done" with a red step.
