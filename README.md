# MovieDB

A movie & series browser built with Next.js 16. Browse trending titles, filter the catalog, track what you watch episode by episode, rate, take private notes and write reviews with threaded comments.

**Demo:** https://movie-db-next-js-react.vercel.app/

There is no backend and no account: everything personal is stored in your browser (localStorage), with export/import of a backup file from **Preferences**. Movie data comes from [TMDB](https://www.themoviedb.org/).

## Features

- **Home:** trending hero carousel, auto-advancing trending rows, _Up next_ (series in progress), _Because you liked…_, _In theaters_, _Coming soon_
- **Browse:** one page with Movies / Series tabs, sort + genre + year + keyword filters (kept in the URL), infinite scroll
- **Search:** header field with live suggestions (press `/` anywhere), full results page
- **Details:** trailer and videos, image gallery, cast (linking to person pages), key crew, keywords, age rating, where to watch for your region, seasons with per-episode tracking, TMDB reviews, recommendations
- **People:** biography and filmography (acting / crew)
- **Your library:** favorites, want to watch / watched, personal 1–10 ratings, private notes (autosaved), reviews and comments
- **Your stats:** time watched, counts, rating distribution, top genres
- **Preferences:** display name, theme (light / dark / system), region, backup / restore / clear data
- Responsive from 360 px phones to wide desktops, keyboard and screen-reader friendly

## Getting started

Requirements: **Node 22+** and **pnpm** (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local   # then put your TMDB v3 API key in TMDB_API_KEY
pnpm dev                     # http://localhost:3000
```

Get a free key at [themoviedb.org → Settings → API](https://www.themoviedb.org/settings/api). The key is only used on the server and never reaches the browser.

## Scripts

| Command                                                | What it does                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `pnpm dev`                                             | Development server                                                               |
| `pnpm build` / `pnpm start`                            | Production build / server                                                        |
| `pnpm check`                                           | Lint + typecheck + unit tests (run before committing)                            |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Unit & component tests (Vitest)                                                  |
| `pnpm test:e2e`                                        | End-to-end tests in Chromium on 4 viewports (Playwright; run `pnpm build` first) |
| `pnpm lint:fix` / `pnpm format`                        | Auto-fix lint issues / format with Prettier                                      |
| `pnpm knip`                                            | Find unused files, exports and dependencies                                      |

First time running e2e: `pnpm exec playwright install chromium`. The e2e tests call TMDB through the app, so they need a valid key in `.env.local`.

## Tech stack

Next.js 16 (App Router, Cache Components, partial prefetching) · React 19 · TypeScript (strict) · Tailwind CSS v4 + shadcn/ui (Radix) · TanStack Query (TMDB data) · Zustand + `persist` (local data) · zod (every external boundary) · react-hook-form · Embla carousel · Vitest + Testing Library + MSW + happy-dom · Playwright + axe · ESLint (incl. immutability and module-boundary rules), Prettier, Husky, commitlint

## Architecture

```
src/app/            routes only: thin pages that compose modules (+ /api/tmdb proxy)
src/modules/<name>/ self-contained feature modules
  model/            pure, unit-tested logic: types, zod schemas, reducers, selectors, mappers
  store/            zustand stores (persisted, versioned, validated)
  api/              TMDB calls (server, cached) or proxy calls (client)
  hooks/ components/
  index.ts          public API (client-safe)
  server.ts         public API (server-only)
src/shared/         ui (shadcn), lib (TMDB client, storage, backup), hooks, utils, config
```

- Dependencies only point **app → modules → shared**. Other modules are imported only through their public API; ESLint enforces it.
- Logic lives in **pure functions** in `model/`; components and stores only wire them up. State is immutable (enforced by `eslint-plugin-functional`).
- TMDB is called on the server and cached with `"use cache"`. The browser only talks to `/api/tmdb/*`, an allow-listed, cached proxy.
- Local data is versioned and zod-validated: corrupt or outdated data is migrated or ignored, never crashes the app.
- Constants (timings, limits, storage keys, routes, cache profiles) live in `src/shared/config` and the modules' `model/` files.

See [CLAUDE.md](CLAUDE.md) for the full conventions.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability is provided by JustWatch.
