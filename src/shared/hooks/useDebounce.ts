"use client";

import { useEffect, useState } from "react";
import { DEBOUNCE_MS } from "@/shared/config/timing";

/** Returns `value` once it has stopped changing for `delayMs`. */
export const useDebounce = <T>(value: T, delayMs: number = DEBOUNCE_MS.search): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
