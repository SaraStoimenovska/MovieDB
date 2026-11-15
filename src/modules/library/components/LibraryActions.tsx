"use client";

import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { FavoriteButton } from "./FavoriteButton";
import { WatchStatusMenu } from "./WatchStatusMenu";

/** Compact overlay for media cards (plugged into the media module's card-actions slot). */
export function CardLibraryActions({ media }: { readonly media: MediaSummary }) {
  return (
    <div className="flex gap-1">
      <FavoriteButton media={media} variant="icon" />
      <WatchStatusMenu media={media} variant="icon" />
    </div>
  );
}

/** Labelled buttons for the details page hero. */
export function LibraryActions({ media }: { readonly media: MediaSummary }) {
  return (
    <>
      <FavoriteButton media={media} />
      <WatchStatusMenu media={media} />
    </>
  );
}
