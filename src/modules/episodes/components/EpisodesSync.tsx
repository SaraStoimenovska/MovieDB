"use client";

import { useEpisodesCrossTabSync } from "../hooks/useEpisodes";

/** Mount once (in the app providers) to keep episode progress in sync across tabs. */
export function EpisodesSync() {
  useEpisodesCrossTabSync();
  return null;
}
