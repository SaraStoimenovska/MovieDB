---
name: pure-functions
description: Where and how to put business logic as pure, unit-tested functions in a module's model/ folder (reducers, selectors, mappers, parsers), and how to test them. Use when adding logic to a component/hook/store, refactoring logic out of UI, or writing tests for model code.
---

# Pure functions first

Business logic lives in `src/modules/<name>/model/*.ts` as **pure, typed functions**.
Components, hooks and stores only wire them up. Examples to copy:
`src/modules/notes/model/notes.ts` (reducers), `src/modules/stats/model/stats.ts` (selectors),
`src/modules/media-details/model/details.ts` (lenient zod parsing + mapping).

## Rules for a pure function

1. **Output depends only on arguments.** No `Date.now()`, `Math.random()`, `crypto.randomUUID()`,
   `localStorage`, `window`, `fetch`, store access or env reads inside. Pass them in:
   `saveNote(data, key, title, body, now)`; the store calls it with `Date.now()`.
2. **No mutation** of arguments (see the `immutable-data` skill). Return new values, or the same
   reference when nothing changed.
3. **Typed in and out**, `readonly` everywhere. External data (TMDB, localStorage, forms, backup
   files) is `unknown` until a zod schema parses it.
4. **Total**: handle empty, missing and invalid input explicitly (return `null`, `[]`, the empty
   state). Parsers of outside data never throw unless the caller expects it.
5. Name by intent: `selectX` (read), `setX`/`toggleX`/`removeX` (reducers `(state, payload) => state`),
   `toX`/`mapX` (mapping), `parseX` (unknown → typed), `isX` (predicates).

## Wiring

- **Store** action = one line delegating to the reducer:
  `save: (key, title, body) => set((s) => saveNote(s, key, title, body, Date.now()))`.
- **Component/hook**: `useMemo(() => selectX(data, arg), [data, arg])`, no logic inline.
- **Server**: `api/server.ts` fetches and passes raw JSON to a model parser.
- Constants (limits, labels, versions) live next to the logic in `model/`, or in
  `src/shared/config/` when shared.

## Tests (`model/<name>.test.ts`, node environment, fast)

```ts
import { deepFreeze } from "@/test/fixtures";
const empty = deepFreeze(EMPTY_NOTES);            // proves no mutation
it("…", () => {
  const next = saveNote(empty, key, "T", "body", 10); // time passed in, deterministic
  expect(selectNote(next, key)).toEqual({ … });
});
```

Cover: the happy path, every branch, empty/invalid input, "unchanged → same reference"
(`toBe`), and migrations of old persisted shapes. Use `makeMedia` / `rawMovie` from
`@/test/fixtures` for domain data.

## Check

`pnpm exec vitest run <path-to-test>` then `pnpm check`.
