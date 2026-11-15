---
name: immutable-data
description: How to write and refactor code under this project's immutability rules (eslint-plugin-functional — no let, no loops, no mutation, readonly types). Use when writing or changing anything in src/, when ESLint reports functional/* errors, or when asked to make code immutable.
---

# Immutable data in this project

Application code in `src/` (except tests, `src/test/`, `src/shared/ui/`) is checked by
`eslint-plugin-functional`: `immutable-data`, `no-let`, `no-loop-statements`, `no-classes`,
`no-this-expressions`, `prefer-property-signatures`. Don't silence these rules; rewrite the code.

## Types

- Every object type field is `readonly`; arrays are `ReadonlyArray<T>`; records are
  `Readonly<Record<K, V>>` (see `NotesData` in `src/modules/notes/model/notes.ts`).
- Use property signatures, not method signatures: `readonly save: (key: K) => void`.
- Enums are `as const` objects + a derived union type:
  ```ts
  export const WatchStatus = { ToWatch: "to_watch", Watched: "watched" } as const;
  export type WatchStatus = (typeof WatchStatus)[keyof typeof WatchStatus];
  ```

## Replacements cheat sheet

| Instead of                        | Write                                                              |
| --------------------------------- | ------------------------------------------------------------------ |
| `let x = a; if (c) x = b;`        | `const x = c ? b : a;`                                             |
| multi-branch `let`                | an IIFE `const x = (() => { if (…) return …; return …; })();`      |
| `for`/`while` building an array   | `map` / `filter` / `flatMap`                                       |
| loop accumulating a value         | `reduce`                                                           |
| `arr.push(x)`                     | `[...arr, x]`                                                      |
| `arr.sort()` / `arr.reverse()`    | `arr.toSorted()` / `arr.toReversed()`                              |
| `arr.splice(i, 1)`                | `arr.toSpliced(i, 1)` or `filter`                                  |
| `arr[i] = x`                      | `arr.with(i, x)`                                                   |
| `obj.a = 1`                       | `{ ...obj, a: 1 }`                                                 |
| `delete obj[key]`                 | `const { [key]: _removed, ...rest } = obj;`                        |
| building an object in a loop      | `Object.fromEntries(entries.map(…))`                               |
| nested update                     | spread each level: `{ ...s, entries: { ...s.entries, [k]: v } }`   |
| `try { x = f() } catch { x = d }` | `const x = (() => { try { return f(); } catch { return d; } })();` |
| class with state                  | plain functions + a type; state lives in a store                   |

## Allowed exceptions

- `ref.current = …` (React refs) — allowed by `ignoreAccessorPattern: ["**.current"]`.
- Mutating a value you just created in the same expression (`ignoreImmediateMutation`).
- Tests may mutate; freeze inputs with `deepFreeze` from `@/test/fixtures` to _prove_ the code
  under test doesn't.

## Returning the same reference

Reducers return the **same object** when nothing changed (e.g. `saveNote` with an unchanged body),
so Zustand/React skip re-renders. Check `if (unchanged) return data;` before spreading.

## Check

`pnpm lint` (or the post-edit hook output). Then `pnpm test` for the changed module.
