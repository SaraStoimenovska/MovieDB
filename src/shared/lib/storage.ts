import { type z } from "zod";
import { type PersistStorage, type StorageValue } from "zustand/middleware";

/**
 * localStorage adapter for zustand `persist` that never throws: corrupt JSON, a full quota or
 * disabled storage (private mode, SSR) all degrade to "nothing stored" instead of crashing.
 */
export const createSafeStorage = <S>(): PersistStorage<S> | undefined => {
  if (typeof window === "undefined") return undefined;

  return {
    getItem: (name) => {
      try {
        const raw = window.localStorage.getItem(name);
        return raw ? (JSON.parse(raw) as StorageValue<S>) : null;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        window.localStorage.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.warn(`Could not save "${name}" to localStorage`, error);
      }
    },
    removeItem: (name) => {
      try {
        window.localStorage.removeItem(name);
      } catch {
        // Storage unavailable: nothing to remove.
      }
    },
  };
};

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
