"use client";

import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { type MediaExtras } from "../model/library";
import { ActionVariant } from "./action-variant";
import { FavoriteButton } from "./FavoriteButton";
import { PersonalRating } from "./PersonalRating";
import { WatchStatusMenu } from "./WatchStatusMenu";

/** Compact overlay for media cards (plugged into the media module's card-actions slot). */
export function CardLibraryActions({ media }: { readonly media: MediaSummary }) {
  return (
    <div className="flex gap-1">
      <FavoriteButton media={media} variant={ActionVariant.Icon} />
      <WatchStatusMenu media={media} variant={ActionVariant.Icon} />
    </div>
  );
}

/** Labelled buttons + personal rating for the details page hero. */
export function LibraryActions({
  media,
  extras,
}: {
  readonly media: MediaSummary;
  readonly extras?: MediaExtras;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <FavoriteButton media={media} extras={extras} />
        <WatchStatusMenu media={media} extras={extras} />
      </div>
      <PersonalRating media={media} extras={extras} />
    </div>
  );
}
