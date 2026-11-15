@AGENTS.md

# Movie Database — project conventions

Movie & series browser: trending, infinite catalog, search, favorites, watched / to-watch, personal notes, reviews, comments.
**No backend, no auth.** All user data lives in the browser (localStorage). Movie data comes from TMDB, fetched on the server.

## Stack

Next.js 16 (App Router, Cache Components, `proxy.ts`), React 19, TypeScript strict, shadcn/ui (Radix) + Tailwind v4,
Zustand (`persist` → localStorage) for user data, TanStack Query for TMDB data, next-themes, zod,
react-hook-form, Vitest + Testing Library + MSW. Package manager: **pnpm**.
English only for now (no i18n library). Locale for formatting comes from `APP_LOCALE` in `src/shared/config`.

## Commands

- `pnpm dev`: dev server
- `pnpm check`: lint + typecheck + tests. Run it before saying a task is done.
- `pnpm lint:fix`, `pnpm format`, `pnpm test:watch`, `pnpm test:coverage`

## Architecture: `app → modules → shared`

```
src/app/...              routing only: thin pages that compose modules
src/modules/<feature>/   standalone feature module (like an Angular standalone component/feature)
  components/ hooks/ api/ model/ store/ __tests__/
  index.ts               PUBLIC API (client-safe): types, pure helpers, client components
  server.ts              PUBLIC API (server-only): cached TMDB calls, async Server Components
src/shared/              ui (shadcn), lib, hooks, utils, config, types: no feature knowledge
```

- Import other modules **only** via `@/modules/<name>` or `@/modules/<name>/server`. Deep imports fail lint.
  Never re-export server-only code from `index.ts`: client components import it, and `server-only` would break the build.
- **Inside a module**, files import each other relatively (`./x`, `../model/x`), never climbing out with `../../`.
- `shared` never imports `modules` or `app`. In `app` and `shared`, use the `@/` alias, never `../`.
- Add shadcn components with `pnpm dlx shadcn@latest add <name>`; they land in `src/shared/ui`.

## Code rules

- **Pure functions first:** business logic lives in `model/` as pure, typed, unit-tested functions. Components and hooks only wire them up.
- **Immutability:** `readonly` / `ReadonlyArray`, no mutation, no `let`, no loops (use map/filter/reduce). Enforced by `eslint-plugin-functional`.
- Store actions delegate to pure reducers `(state, payload) => newState` that live in `model/`.
- Validate every external boundary with **zod**: TMDB responses, localStorage contents, form input, env.
- **Server Components by default.** Add `"use client"` only for interactivity or browser APIs (localStorage).
- Persisted stores: versioned key `mdb:<name>`, zod-validated on rehydrate, with a `migrate` for each version bump. Guard against SSR hydration mismatch.
- Format dates, numbers, runtime and currency through `shared/hooks` (`useFormatters`), or on the server through `shared/utils/format` with `APP_LOCALE`. Never inline `toLocaleString`.
- The TMDB key is server-only (`src/shared/lib/env.ts`). Client code calls TMDB through `/api/tmdb/*`.
- Name things: components `PascalCase.tsx`, hooks `useThing.ts`, everything else `kebab-case.ts`; tests next to the code as `*.test.ts(x)`.
- Tests run in the `node` environment by default (fast). Files that render components or hooks start with `// @vitest-environment happy-dom`.
- Cross-feature UI goes through slots, not imports: e.g. the app plugs library buttons into every `MediaCard` via `MediaCardActionsProvider` (see `src/app/providers.tsx`).

## Agents

- `senior-developer`: implements features following these rules.
- `senior-qa`: writes and reviews tests, hunts edge cases.

## Skills (`.claude/skills/`)

`new-module`, `pure-functions`, `immutable-data` (how to write code here), `probe` (check the real
app in a browser), `verify` (full check before "done"), `ship` (commit/merge/push).

## Hooks (`.claude/settings.json` → `.claude/hooks/*.mjs`)

- **post-edit**: blocks broken encoding (mojibake, BOM), then Prettier + ESLint on the edited file.
- **secret-guard**: no reading `.env*` (except `.env.example`) or printing env secrets.
  Leak check: `node .claude/hooks/scan-secrets.mjs`.
- **branch-guard**: always work on a branch; editing repo files while `main` is checked out is
  blocked.
- **git-guard**: every git command that changes something asks the user first (read-only ones
  like `status`/`diff`/`log` don't). Commits only on the work branch, after a fresh `pnpm build`.
  The user tests the branch, then approves merging into `main` and pushing (only `main` is
  pushed). Never `--no-verify`, force push, `reset --hard`.
- **stop-tests**: when Claude finishes, runs `vitest related` for changed source files and warns
  if they fail.
