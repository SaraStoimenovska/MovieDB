"use client";

import Image from "next/image";
import { useState } from "react";
import { type PosterSize, tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { cn } from "@/shared/utils/cn";

/** Static placeholder (in `public/`) for titles without a poster, or when the CDN image fails. */
export const FALLBACK_POSTER_SRC = "/fallback-poster.svg";

type Props = {
  readonly path: string | null;
  readonly title: string;
  readonly size?: PosterSize;
  /** Responsive `sizes` hint for the browser. */
  readonly sizes?: string;
  readonly priority?: boolean;
  /**
   * Purely visual (the title is already written right next to it, e.g. list rows and cards):
   * empty alt, so screen readers don't announce the title twice.
   */
  readonly decorative?: boolean;
  readonly className?: string;
};

/**
 * 2:3 poster. The URL is built straight from the list item's `poster_path`
 * (`https://image.tmdb.org/t/p/{size}{path}`), with no extra API call. TMDB already serves
 * pre-sized images, so the Next image optimizer is skipped (`unoptimized`) to avoid resizing twice.
 */
export function MediaPoster({
  path,
  title,
  size = "w342",
  sizes = "(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 45vw",
  priority = false,
  decorative = false,
  className,
}: Props) {
  const remote = tmdbImageUrl(path, size);
  // Remember WHICH url failed, so a new `path` gets a fresh try without an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useFallback = !remote || failedSrc === remote;
  const src = useFallback ? FALLBACK_POSTER_SRC : remote;
  const alt = decorative ? "" : useFallback ? `No poster for ${title}` : `Poster of ${title}`;

  return (
    <div className={cn("relative aspect-[2/3] overflow-hidden rounded-md bg-muted", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        onError={useFallback ? undefined : () => setFailedSrc(remote)}
        className="object-cover"
      />
    </div>
  );
}
