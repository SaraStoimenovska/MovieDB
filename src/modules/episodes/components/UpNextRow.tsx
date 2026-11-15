"use client";

import { PlayCircle } from "lucide-react";
import Link from "next/link";
import { MediaPoster } from "@/modules/media";
import { routes } from "@/shared/config/routes";
import { MediaType } from "@/shared/lib/tmdb/types";
import { useEpisodesData } from "../hooks/useEpisodes";
import { formatEpisodeRef, progressSummary, selectUpNext } from "../model/episodes";
import { EPISODES_SECTION_ID } from "./EpisodeTracker";
import { ProgressBar } from "./ProgressBar";

/** Shows shown in "Up next" (most recently watched first). */
const UP_NEXT_LIMIT = 12;

/** "Continue watching": series you've started, with the next episode. Hidden when empty. */
export function UpNextRow() {
  const { data } = useEpisodesData();
  const items = selectUpNext(data).slice(0, UP_NEXT_LIMIT);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="up-next-heading" className="space-y-3">
      <h2
        id="up-next-heading"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl"
      >
        <PlayCircle className="size-5" aria-hidden />
        Up next
      </h2>
      <ul className="flex snap-x gap-4 overflow-x-auto pb-4">
        {items.map(({ progress, next }) => {
          const summary = progressSummary(progress);
          return (
            <li key={progress.show.key} className="w-36 shrink-0 snap-start sm:w-40">
              <Link
                href={`${routes.media(MediaType.Tv, progress.show.id)}#${EPISODES_SECTION_ID}`}
                className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <MediaPoster
                  path={progress.show.posterPath}
                  title={progress.show.title}
                  sizes="160px"
                  decorative
                  className="transition-transform group-hover:scale-[1.02]"
                />
                <p className="mt-2 line-clamp-1 text-sm font-medium">{progress.show.title}</p>
                <p className="text-xs text-muted-foreground">Next: {formatEpisodeRef(next)}</p>
                <ProgressBar
                  percent={summary.percent}
                  label={`${progress.show.title}: ${summary.percent}% watched`}
                  className="mt-1.5"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
