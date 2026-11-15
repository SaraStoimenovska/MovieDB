# MovieDB

A movie & series companion built with **Next.js 16** and **React 19**: discover what's trending, browse and search the whole TMDB catalog, and keep your own library of favorites, watch lists, ratings, notes and reviews, plus upcoming releases, franchise collections and lists you can share with a link.

**Live demo:** https://ss-movie-db.vercel.app/

There is **no backend and no account**. Everything personal stays in your browser (localStorage) and can be exported/imported as a backup file from **Preferences**. Movie data comes from [TMDB](https://www.themoviedb.org/), fetched on the server so the API key never reaches the browser.

## Features

**Discover**

- **Home:** trending hero carousel, auto-advancing trending rows, _Up next_ (series you're watching), _In theaters_, _Coming soon_
- **Browse:** Movies / Series tabs, sort + genre + year + keyword filters kept in the URL, infinite scroll
- **Search:** header field with live suggestions (press `/` anywhere), full results page
- **Details:** trailer and videos, image gallery, cast and key crew, keywords and genres (linking to filtered browse), age rating, where to watch in your region, TMDB reviews, recommendations (_Because you liked…_ once it's a favorite)
- **Collections:** franchise films in release order with your watched progress, on the movie page and on a collection page
- **People:** biography and filmography (acting / crew)

**Your library** (stored in this browser)

- **Favorites** and **My list** (_Want to watch_ / _Watched_), with sort, type and genre filters, grid or list view
- **Ratings** (1–10), private **notes** (autosaved), **reviews** with threaded **comments**
- **Episode tracking** for series, with progress and _Up next_
- **Upcoming:** release dates of titles on your list and next episodes of series you follow, grouped by this week / this month / later
- **Share a list:** a link that carries the list itself (nothing is uploaded); the recipient can add everything to their own list
- **Your stats:** time watched, counts, rating distribution, top genres
- **Preferences:** display name, theme (light / dark / system), region for streaming availability, backup / restore / clear data

Responsive from 360 px phones to wide desktops, keyboard and screen-reader friendly (checked with axe in the e2e tests).

## Getting started

Requirements: **Node 22+** and **pnpm** (`corepack enable`), and a free TMDB API key.

```bash
pnpm install
cp .env.example .env.local   # then set TMDB_API_KEY (TMDB v3 API key)
pnpm dev                     # http://localhost:3000
```

Get a key at [themoviedb.org → Settings → API](https://www.themoviedb.org/settings/api). It's only used on the server.

| Environment variable | Required | Description                                                        |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `TMDB_API_KEY`       | yes      | TMDB v3 API key                                                    |
| `TMDB_API_BASE_URL`  | no       | Override the TMDB API URL (default `https://api.themoviedb.org/3`) |

### Deploying

The demo runs on [Vercel](https://vercel.com/): import the repository, add `TMDB_API_KEY` under **Settings → Environment Variables**, and deploy. Every push to `main` redeploys. TMDB responses are cached on the server (hours for lists, a day for details), so new data can take that long to appear on already-visited pages.

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

Next.js 16 (App Router, Cache Components, partial prefetching) · React 19 · TypeScript (strict) · Tailwind CSS v4 + shadcn/ui (Radix) · TanStack Query (TMDB data in the browser) · Zustand + `persist` (local data) · zod (every external boundary) · react-hook-form · Embla carousel · Vitest + Testing Library + MSW + happy-dom · Playwright + axe · ESLint (immutability and module-boundary rules), Prettier, Husky, lint-staged, commitlint

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

| Module                                        | Responsibility                                                       |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `catalog`, `search`, `media`, `media-details` | Trending, browse, search, cards/carousels, details pages             |
| `people`, `collections`                       | Person pages, movie franchises                                       |
| `library`, `episodes`, `notes`, `reviews`     | Favorites/lists/ratings, episode tracking, notes, reviews + comments |
| `upcoming`, `sharing`, `stats`                | Upcoming releases, shareable list links, personal statistics         |
| `preferences`, `shell`                        | Settings, theme, backup; header, navigation, footer                  |

- Dependencies only point **app → modules → shared**. Other modules are imported only through their public API; ESLint enforces it. Cross-feature UI goes through slots (e.g. the app plugs library buttons into every card and details page).
- Logic lives in **pure functions** in `model/`; components and stores only wire them up. State is immutable (enforced by `eslint-plugin-functional`).
- TMDB is called on the server and cached with `"use cache"`. The browser only talks to `/api/tmdb/*`, an allow-listed, cached proxy.
- Constants (timings, limits, storage keys, routes, cache profiles) live in `src/shared/config` and the modules' `model/` files.

### What's stored in your browser

| Key                            | Contents                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `mdb:library`                  | Favorites, watch status, ratings, plus the card data (title, poster, year, score, genres) so lists render without calling TMDB |
| `mdb:episodes`                 | Watched episodes per series                                                                                                    |
| `mdb:notes`                    | Private notes per title                                                                                                        |
| `mdb:reviews` / `mdb:comments` | Your reviews and their comment threads                                                                                         |
| `mdb:preferences`              | Display name, region, grid/list view                                                                                           |
| `mdb:theme`                    | Light / dark / system                                                                                                          |

Each store is versioned and zod-validated: older data is migrated, corrupt data is ignored, and the app never crashes on it. Shared links carry only titles (type + TMDB id), never ratings or notes.

## Development with Claude Code

The repository is set up for [Claude Code](https://claude.com/claude-code); see [CLAUDE.md](CLAUDE.md) for the full conventions.

- **Agents** (`.claude/agents/`): `senior-developer` (implements features following the architecture) and `senior-qa` (tests and edge cases).
- **Skills** (`.claude/skills/`): `new-module`, `pure-functions`, `immutable-data`, `probe` (check a page in a real browser), `verify` (full check before "done"), `ship` (git workflow).
- **Hooks** (`.claude/settings.json`): format + lint every edited file and block broken encodings; never read `.env` files or print secrets; work on a branch, build before committing, and ask before every git action that changes something; run related tests when a turn ends.

Workflow: work on a local branch → verify → commit → the change is tested → merge into `main` and push (each git step approved).

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability is provided by JustWatch.
