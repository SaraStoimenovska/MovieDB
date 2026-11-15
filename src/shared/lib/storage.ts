import { type z } from "zod";
import { type PersistOptions, type PersistStorage, type StorageValue } from "zustand/middleware";

/** localStorage, or null on the server / when the browser blocks access to it. */
const getLocalStorage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

/**
 * localStorage adapter for zustand `persist` that never throws: corrupt JSON, a full quota or
 * disabled storage (private mode, SSR) all degrade to "nothing stored" instead of crashing.
 *
 * Always returns an adapter (also on the server, where it reads/writes nothing): zustand only
 * creates the `store.persist` API when a storage exists, and code like
 * `store.persist.rehydrate` must be safe to reference during server rendering.
 */
export const createSafeStorage = <S>(): PersistStorage<S> => ({
  getItem: (name) => {
    try {
      const raw = getLocalStorage()?.getItem(name);
      return raw ? (JSON.parse(raw) as StorageValue<S>) : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      getLocalStorage()?.setItem(name, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not save "${name}" to localStorage`, error);
    }
  },
  removeItem: (name) => {
    try {
      getLocalStorage()?.removeItem(name);
    } catch {
      // Storage unavailable: nothing to remove.
    }
  },
});

/**
 * `merge` for zustand `persist`: only accept persisted data that passes the schema.
 * Anything else (hand-edited, from an old buggy build, another app) is ignored, and defaults win.
 */
export const validatedMerge =
  <D extends object>(schema: z.ZodType<D>) =>
  <T extends object>(persisted: unknown, current: T): T => {
    const parsed = schema.safeParse(persisted);
    if (!parsed.success && persisted !== undefined && persisted !== null) {
      console.warn("Ignoring invalid persisted data", parsed.error.issues);
    }
    return parsed.success ? { ...current, ...parsed.data } : current;
  };

type PersistedStoreConfig<S extends object, D extends object> = {
  /** localStorage key, from `STORAGE_KEYS`. */
  readonly name: string;
  /** Bump when `D` changes shape, and handle the old shape in `migrate`. */
  readonly version: number;
  readonly schema: z.ZodType<D>;
  /** Data part of the state to persist (actions are never stored). */
  readonly pick: (state: S) => D;
  readonly migrate?: (persisted: unknown, fromVersion: number) => D;
};

/**
 * The one way stores in this app persist: safe storage, zod-validated rehydration, versioning.
 * Usage: `create<S>()(persist(initializer, persistedStoreOptions({ ... })))`.
 */
export const persistedStoreOptions = <S extends object, D extends object>({
  name,
  version,
  schema,
  pick,
  migrate = (persisted) => persisted as D,
}: PersistedStoreConfig<S, D>): PersistOptions<S, D> => ({
  name,
  version,
  storage: createSafeStorage<D>(),
  partialize: pick,
  merge: (persisted, current) => validatedMerge(schema)(persisted, current),
  migrate,
});
