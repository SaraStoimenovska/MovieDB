"use client";

import { X } from "lucide-react";
import { toast } from "sonner";
import { RatingInput } from "@/shared/components/RatingInput";
import { RATING_SCALE } from "@/shared/config/rating";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { useLibraryActions, useLibraryEntry } from "../hooks/useLibrary";
import { type MediaExtras } from "../model/library";

type Props = { readonly media: MediaSummary; readonly extras?: MediaExtras };

/** "Your rating" on the details page: 1–10 stars, saved instantly (and marks as watched). */
export function PersonalRating({ media, extras }: Props) {
  const entry = useLibraryEntry(media.key);
  const { setRating } = useLibraryActions();
  const rating = entry?.rating ?? 0;

  const rate = (value: number | null) => {
    const previous = entry?.rating ?? null;
    setRating(media, value, extras);
    toast(value === null ? "Rating removed" : `Rated ${value}/${RATING_SCALE.max}`, {
      description: value === null ? media.title : `${media.title} · marked as watched`,
      action: { label: "Undo", onClick: () => setRating(media, previous, extras) },
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <RatingInput value={rating} onChange={rate} legend="Your rating" />
      {rating > 0 && (
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => rate(null)}>
          <X className="size-3.5" aria-hidden />
          Clear
        </Button>
      )}
    </div>
  );
}
