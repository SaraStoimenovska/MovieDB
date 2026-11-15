"use client";

import { useCallback, useEffect, useState } from "react";
import { INFINITE_SCROLL_ROOT_MARGIN } from "@/shared/config/timing";

type Options = {
  readonly rootMargin?: string;
  readonly threshold?: number;
  /** Stop observing (e.g. while a page is loading, or when there is no next page). */
  readonly disabled?: boolean;
};

/**
 * Tracks whether an element is in the viewport (IntersectionObserver).
 * Used as the sentinel for infinite scrolling. Returns a callback ref, so it works
 * when the element mounts and unmounts conditionally.
 *
 * `inView` is reset whenever observation stops, so re-enabling never reports a stale
 * "visible" before the new observer has measured the element's real position.
 */
export const useInView = <E extends Element = HTMLDivElement>({
  rootMargin = INFINITE_SCROLL_ROOT_MARGIN,
  threshold = 0,
  disabled = false,
}: Options = {}) => {
  const [element, setElement] = useState<E | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!element || disabled || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin, threshold },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      setInView(false);
    };
  }, [element, disabled, rootMargin, threshold]);

  const ref = useCallback((node: E | null) => setElement(node), []);

  return { ref, inView: inView && !disabled } as const;
};
