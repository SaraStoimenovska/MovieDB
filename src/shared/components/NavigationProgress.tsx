"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  isTrackedNavigationClick,
  startNavigation,
  stopNavigation,
  useNavigationProgressStore,
} from "@/shared/lib/navigation-progress";

/**
 * Thin bar at the very top while the next page is on its way (before its `loading.tsx` or
 * content can show). Mount once in the root layout, inside a Suspense boundary
 * (it reads the search params).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = search ? `${pathname}?${search}` : pathname;
  const from = useNavigationProgressStore((state) => state.from);
  // Derived: if the URL already changed, we're done, even before the effect below runs.
  const pending = from !== null && from === current;

  // The URL changed: the new page is rendering (its own spinner/skeleton takes over).
  useEffect(() => stopNavigation(), [current]);

  useEffect(() => {
    // Capture phase: runs before <Link> handles (and prevents) the click.
    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      const here = new URL(window.location.href);
      const tracked = isTrackedNavigationClick(
        {
          button: event.button,
          modifier: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
          defaultPrevented: event.defaultPrevented,
          anchor:
            anchor instanceof HTMLAnchorElement
              ? {
                  href: anchor.href,
                  target: anchor.target,
                  download: anchor.hasAttribute("download"),
                }
              : null,
        },
        here,
      );
      if (tracked) startNavigation(`${here.pathname}${here.search}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!pending) return null;
  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
    >
      <div className="nav-progress h-full bg-primary shadow-[0_0_8px] shadow-primary" />
    </div>
  );
}
