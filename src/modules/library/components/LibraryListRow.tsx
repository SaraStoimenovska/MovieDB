"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { MediaPoster, MediaRating } from "@/modules/media";
import { routes } from "@/shared/config/routes";
import { RATING_SCALE } from "@/shared/config/rating";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { MEDIA_TYPE_LABELS } from "@/shared/lib/tmdb/types";
import { Badge } from "@/shared/ui/badge";
import { type LibraryEntry, snapshotToSummary } from "../model/library";
import { CardLibraryActions } from "./LibraryActions";

type Props = {
  readonly entry: LibraryEntry;
  /** When it was added to the list being shown (epoch ms). */
  readonly addedAt: number | null;
};

/** Compact row for the list layout: small poster, facts, your rating, actions. */
export function LibraryListRow({ entry, addedAt }: Props) {
  const format = useFormatters();
  const media = snapshotToSummary(entry.media);
  const year = format.year(media.releaseDate);

  return (
    <article className="flex items-center gap-3 rounded-lg border p-2 sm:gap-4">
      <Link
        href={routes.media(media.mediaType, media.id)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:gap-4"
      >
        <MediaPoster
          path={media.posterPath}
          title={media.title}
          size="w92"
          sizes="48px"
          decorative
          className="w-12 shrink-0"
        />
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-medium">{media.title}</h3>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {year && <span>{year}</span>}
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {MEDIA_TYPE_LABELS[media.mediaType]}
            </Badge>
            <MediaRating
              value={media.voteAverage}
              voteCount={media.voteCount}
              className="text-xs"
            />
            {entry.rating !== null && (
              <span className="inline-flex items-center gap-0.5 text-foreground">
                <Star className="size-3 fill-current text-amber-500" aria-hidden />
                <span className="sr-only">Your rating:</span>
                {entry.rating}/{RATING_SCALE.max}
              </span>
            )}
            {addedAt !== null && <span>Added {format.relativeTime(addedAt)}</span>}
          </p>
        </div>
      </Link>
      <CardLibraryActions media={media} />
    </article>
  );
}
