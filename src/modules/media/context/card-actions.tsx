"use client";

import { createContext, type ReactNode, useContext } from "react";
import { type MediaSummary } from "@/shared/lib/tmdb/types";

/** Render function (not a component) so cards never create component types during render. */
export type MediaCardActionsRenderer = (media: MediaSummary) => ReactNode;

const MediaCardActionsContext = createContext<MediaCardActionsRenderer | null>(null);

/**
 * Slot for per-card actions (favorite, watchlist…). The app plugs the library module in here,
 * so the media module renders the buttons without depending on any feature module.
 * Pass a stable (module-level) function to avoid re-rendering every card.
 */
export function MediaCardActionsProvider({
  render,
  children,
}: {
  readonly render: MediaCardActionsRenderer;
  readonly children: ReactNode;
}) {
  return (
    <MediaCardActionsContext.Provider value={render}>{children}</MediaCardActionsContext.Provider>
  );
}

export const useMediaCardActions = (): MediaCardActionsRenderer | null =>
  useContext(MediaCardActionsContext);
