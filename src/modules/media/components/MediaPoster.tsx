import { Film } from "lucide-react";
import Image from "next/image";
import { type PosterSize, tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { cn } from "@/shared/utils/cn";

type Props = {
  readonly path: string | null;
  readonly title: string;
  readonly size?: PosterSize;
  /** Responsive `sizes` hint for the browser. */
  readonly sizes?: string;
  readonly priority?: boolean;
  readonly className?: string;
};

/**
 * 2:3 poster with a graceful placeholder. TMDB already serves pre-sized images,
 * so the Next image optimizer is skipped (`unoptimized`) to avoid resizing twice.
 */
export function MediaPoster({
  path,
  title,
  size = "w342",
  sizes = "(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 45vw",
  priority = false,
  className,
}: Props) {
  const src = tmdbImageUrl(path, size);

  return (
    <div className={cn("relative aspect-[2/3] overflow-hidden rounded-md bg-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt={`Poster of ${title}`}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          className="object-cover"
        />
      ) : (
        <div
          className="flex h-full items-center justify-center text-muted-foreground"
          role="img"
          aria-label={`No poster for ${title}`}
        >
          <Film className="size-10" aria-hidden />
        </div>
      )}
    </div>
  );
}
