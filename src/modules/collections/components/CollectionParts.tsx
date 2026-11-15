"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useLibraryData, WatchStatus } from "@/modules/library";
import { MediaPoster } from "@/modules/media";
import { ProgressBar } from "@/shared/components/ProgressBar";
import { routes } from "@/shared/config/routes";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { type MediaKey, type MediaSummary } from "@/shared/lib/tmdb/types";
import { cn } from "@/shared/utils/cn";
import { collectionProgress } from "../model/collection";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

type Props = {
  readonly name: string;
  readonly parts: ReadonlyArray<MediaSummary>;
  /** The movie whose page this is on (highlighted, "You're here"). */
  readonly currentId?: number;
  /** "row": horizontal scroller (details page); "grid": full page. */
  readonly layout: "row" | "grid";
};

/** The collection's films in release order, with your watched marks and progress. */
export function CollectionParts({ name, parts, currentId, layout }: Props) {
  const { data, ready } = useLibraryData();
  const format = useFormatters();
  const isWatched = useMemo(
    () => (key: MediaKey) => data.entries[key]?.status === WatchStatus.Watched,
    [data],
  );
  // Library data is browser-only: progress appears after hydration (no mismatch).
  const progress = useMemo(
    () => (ready ? collectionProgress(parts, isWatched, todayIso()) : null),
    [ready, parts, isWatched],
  );

  return (
    <div className="space-y-4">
      {progress && progress.total > 0 && (
        <div className="max-w-sm space-y-1.5">
          <p className="text-sm text-muted-foreground">
            You&apos;ve watched{" "}
            <span className="font-medium text-foreground">
              {progress.watched} of {progress.total}
            </span>{" "}
            released films
          </p>
          <ProgressBar percent={progress.percent} label={`${name}: ${progress.percent}% watched`} />
        </div>
      )}

      <ol
        className={cn(
          layout === "row"
            ? "flex snap-x gap-4 overflow-x-auto pb-4"
            : "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        )}
      >
        {parts.map((part, index) => {
          const watched = ready && isWatched(part.key);
          const isCurrent = part.id === currentId;
          const year = format.year(part.releaseDate);
          return (
            <li
              key={part.key}
              className={cn("min-w-0", layout === "row" && "w-32 shrink-0 snap-start sm:w-36")}
            >
              <Link
                href={routes.media(part.mediaType, part.id)}
                aria-current={isCurrent ? "page" : undefined}
                className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="relative">
                  <MediaPoster
                    path={part.posterPath}
                    title={part.title}
                    size="w185"
                    sizes={layout === "row" ? "144px" : "(min-width: 1024px) 16vw, 45vw"}
                    decorative
                    className={cn(
                      "transition-transform group-hover:scale-[1.02]",
                      isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                  />
                  {watched && (
                    <span className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-0.5 shadow">
                      <CheckCircle2 className="size-4 text-green-600" aria-hidden />
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-tight font-medium">
                  <span className="text-muted-foreground tabular-nums">{index + 1}. </span>
                  {part.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {year || "Coming soon"}
                  {watched && <span className="sr-only">, watched</span>}
                  {isCurrent && " · You're here"}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
