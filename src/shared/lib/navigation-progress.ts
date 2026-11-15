import { create } from "zustand";

/**
 * Global "a page is loading" signal for the top progress bar. Next only reports pending state
 * per `<Link>` (`useLinkStatus`), so the bar is started on internal link clicks (see
 * `isTrackedNavigationClick`) or explicitly with `startNavigation()` before `router.push`, and
 * stops as soon as the URL changes.
 */
type NavigationProgressState = {
  /** URL (path + query) we're navigating away from; `null` when idle. */
  readonly from: string | null;
};

export const useNavigationProgressStore = create<NavigationProgressState>(() => ({ from: null }));

export const startNavigation = (from: string): void =>
  useNavigationProgressStore.setState({ from });

export const stopNavigation = (): void => useNavigationProgressStore.setState({ from: null });

/** The bits of a click and its anchor that decide whether it's an in-app navigation. */
export type NavigationClick = {
  readonly button: number;
  readonly modifier: boolean;
  readonly defaultPrevented: boolean;
  /** Anchor attributes; `null` when the click wasn't on a link. */
  readonly anchor: {
    readonly href: string;
    readonly target: string;
    readonly download: boolean;
  } | null;
};

/** path + query of a URL: hash-only changes don't load anything. */
export const pageKey = (url: URL): string => `${url.pathname}${url.search}`;

/**
 * Pure: does this click start a client-side navigation to a *different* page of this app?
 * New tabs, downloads, other origins, modified clicks and hash links don't.
 */
export const isTrackedNavigationClick = (click: NavigationClick, current: URL): boolean => {
  if (click.defaultPrevented || click.button !== 0 || click.modifier || !click.anchor) return false;
  const { href, target, download } = click.anchor;
  if (download || (target !== "" && target !== "_self")) return false;
  const next = (() => {
    try {
      return new URL(href, current);
    } catch {
      return null;
    }
  })();
  return next !== null && next.origin === current.origin && pageKey(next) !== pageKey(current);
};
