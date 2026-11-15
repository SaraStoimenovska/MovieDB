"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { useLibraryActions, useLibraryEntry } from "../hooks/useLibrary";
import { type MediaExtras } from "../model/library";
import { ActionVariant, OVERLAY_ICON_BUTTON } from "./action-variant";

type Props = {
  readonly media: MediaSummary;
  readonly variant?: ActionVariant;
  readonly extras?: MediaExtras;
};

const ACTIVE_HEART = "fill-red-500 text-red-500";

/**
 * Toggle button: the accessible name stays constant and `aria-pressed` carries the state,
 * which is how screen readers expect toggles to behave.
 */
export function FavoriteButton({ media, variant = ActionVariant.Full, extras }: Props) {
  const entry = useLibraryEntry(media.key);
  const { toggleFavorite } = useLibraryActions();
  const active = entry?.isFavorite ?? false;

  const onClick = () => {
    toggleFavorite(media, extras);
    toast(active ? "Removed from favorites" : "Added to favorites", {
      description: media.title,
      action: { label: "Undo", onClick: () => toggleFavorite(media, extras) },
    });
  };

  return variant === ActionVariant.Icon ? (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Favorite: ${media.title}`}
      title={active ? "Remove from favorites" : "Add to favorites"}
      className={OVERLAY_ICON_BUTTON}
    >
      <Heart className={cn("size-4", active && ACTIVE_HEART)} />
    </Button>
  ) : (
    <Button type="button" variant="outline" onClick={onClick} aria-pressed={active}>
      <Heart className={cn("size-4", active && ACTIVE_HEART)} />
      {active ? "In favorites" : "Add to favorites"}
    </Button>
  );
}
