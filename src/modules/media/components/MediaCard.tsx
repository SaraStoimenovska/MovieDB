"use client";

import Link from "next/link";
import { APP_LOCALE } from "@/shared/config/app";
import { routes } from "@/shared/config/routes";
import { MEDIA_TYPE_LABELS, type MediaSummary } from "@/shared/lib/tmdb/types";
import { Badge } from "@/shared/ui/badge";
import { formatYear } from "@/shared/utils/format";
import { useMediaCardActions } from "../context/card-actions";
import { MediaPoster } from "./MediaPoster";
import { MediaRating } from "./MediaRating";

type Props = {
  readonly media: MediaSummary;
  readonly priority?: boolean;
  readonly showType?: boolean;
  /** Poster `sizes` hint; carousels pass a fixed width. */
  readonly sizes?: string;
};

export function MediaCard({ media, priority = false, showType = false, sizes }: Props) {
  const year = formatYear(media.releaseDate, APP_LOCALE);
  const renderActions = useMediaCardActions();

  return (
    <article className="group relative">
      <Link
        href={routes.media(media.mediaType, media.id)}
        className="block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <MediaPoster
          path={media.posterPath}
          title={media.title}
          priority={priority}
          decorative
          sizes={sizes}
          className="transition-transform duration-200 group-hover:scale-[1.02]"
        />
        <div className="mt-2 space-y-1">
          <h3 className="line-clamp-2 text-sm leading-tight font-medium">{media.title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {year && <span>{year}</span>}
            <MediaRating
              value={media.voteAverage}
              voteCount={media.voteCount}
              className="text-xs"
            />
            {showType && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {MEDIA_TYPE_LABELS[media.mediaType]}
              </Badge>
            )}
          </div>
        </div>
      </Link>
      {/* Sibling of the link (not inside it): interactive elements must not be nested in <a>. */}
      {renderActions && <div className="absolute top-2 right-2">{renderActions(media)}</div>}
    </article>
  );
}
