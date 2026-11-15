"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { useLibraryActions, useLibraryEntry } from "../hooks/useLibrary";

type Props = { readonly media: MediaSummary; readonly variant?: "icon" | "full" };

export function FavoriteButton({ media, variant = "full" }: Props) {
  const entry = useLibraryEntry(media.key);
  const { toggleFavorite } = useLibraryActions();
  const active = entry?.isFavorite ?? false;
  const label = active ? `Remove ${media.title} from favorites` : `Add ${media.title} to favorites`;

  const onClick = () => {
    toggleFavorite(media);
    toast(active ? "Removed from favorites" : "Added to favorites", {
      description: media.title,
      action: { label: "Undo", onClick: () => toggleFavorite(media) },
    });
  };

  return variant === "icon" ? (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={active ? "Remove from favorites" : "Add to favorites"}
      className="size-8 rounded-full bg-background/80 shadow backdrop-blur hover:bg-background"
    >
      <Heart className={cn("size-4", active && "fill-red-500 text-red-500")} />
    </Button>
  ) : (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
    >
      <Heart className={cn("size-4", active && "fill-red-500 text-red-500")} />
      {active ? "Favorite" : "Add to favorites"}
    </Button>
  );
}
