---
name: new-module
description: Scaffold a new feature module in src/modules/<name> following the app → modules → shared architecture (model/, store/, components/, hooks/, api/, index.ts, server.ts, tests) and wire it into the app. Use when adding a new feature area or splitting one out of an existing module.
---

# New feature module

Read `CLAUDE.md` first. Model it on an existing module of the same kind:

- local data only → `src/modules/notes/`
- TMDB data on the server → `src/modules/people/`
- both → `src/modules/episodes/`

## 1. Decide the name and boundaries

- Folder name: kebab-case noun (`watch-history`). One feature per module.
- What other modules does it need? Only through their public API
  (`@/modules/<name>` or `@/modules/<name>/server`). No deep imports; ESLint fails on them.
- Does it need UI inside another module (cards, details page)? Use the existing **slots**
  (`MediaCardActionsProvider` in `src/app/providers.tsx`, `renderActions` / `renderExtra` in
  `src/app/_details/slots.tsx`). Don't import it from the other module.

## 2. Files (create only what you need)

```
src/modules/<name>/
  model/<name>.ts         types (readonly), constants, zod schemas, pure reducers/selectors
  model/<name>.test.ts    unit tests (node env)
  store/<name>-store.ts   zustand + persist (if it stores user data) + BackupSource
  hooks/use<Thing>.ts     read the store / TanStack Query; hydration-safe
  components/<Thing>.tsx  "use client" only when interactive or using browser APIs
  components/<Thing>.test.tsx  starts with `// @vitest-environment happy-dom`
  api/server.ts           `import "server-only"`; "use cache" + cacheLife + cacheTag
  index.ts                PUBLIC, client-safe: types, pure helpers, client components
  server.ts               PUBLIC, server-only: cached TMDB calls, async Server Components
```

Never export server-only code from `index.ts`.

## 3. Persisted data (if any)

- Key in `src/shared/config/storage-keys.ts` (`mdb:<name>`), `VERSION = 1`, zod schema,
  `migrate`, `persistedStoreOptions(...)` from `@/shared/lib/storage`.
- Export a `BackupSource` and add it to the Preferences page sources
  (`src/app/preferences/_components/AppDataManagement.tsx`).
- Add a `<Name>Sync` component (cross-tab rehydrate) to `src/app/providers.tsx` if other tabs
  must see changes.

## 4. TMDB data (if any)

- Server: `tmdbGet` in `api/server.ts`, lenient zod parsing in `model/`, `cacheLife`/`cacheTag`
  from `@/shared/config/cache`.
- Browser: `tmdbProxyGet` via `/api/tmdb/*`. Add the path to `ALLOWED_PATHS` in
  `src/shared/lib/tmdb/request.ts` (and any new query keys), plus an MSW handler in tests.

## 5. Routes

Thin pages in `src/app/<route>/page.tsx` that compose the module. Add route builders to
`src/shared/config/routes.ts` and nav entries if needed. Add `loading.tsx` only if the route
needs its own fallback.

## 6. Finish

Apply the `pure-functions` and `immutable-data` skills, then run the `verify` skill.
Update README's feature list if user-visible.
