"use client";

import { useEffect } from "react";

/**
 * Keeps a persisted store in sync across browser tabs: when another tab writes `key`
 * (the `storage` event only fires in *other* tabs), re-read it into this tab's store.
 */
export const useRehydrateOnStorage = (key: string, rehydrate: () => unknown) => {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) void rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, rehydrate]);
};
