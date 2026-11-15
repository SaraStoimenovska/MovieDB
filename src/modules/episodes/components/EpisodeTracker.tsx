"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ListChecks, Tv } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { MediaPoster } from "@/modules/media";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { tmdbProxyGet } from "@/shared/lib/tmdb/browser";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/utils/cn";
import { pluralize } from "@/shared/utils/text";
import { useEpisodeActions, useSeasonEpisodes, useShowProgress } from "../hooks/useEpisodes";
import {
  formatEpisodeRef,
  isEpisodeWatched,
  nextEpisode,
  progressSummary,
  type SeasonInfo,
  type ShowProgress,
  type ShowRef,
  SPECIALS_SEASON,
  watchedInSeason,
} from "../model/episodes";
import { hasAired, parseSeasonEpisodes, seasonKeys, todayIso } from "../model/season";
import { ProgressBar } from "@/shared/components/ProgressBar";

type TrackerSeason = SeasonInfo & {
  readonly airDate: string | null;
  readonly posterPath: string | null;
};

type Props = { readonly show: ShowRef; readonly seasons: ReadonlyArray<TrackerSeason> };

export const EPISODES_SECTION_ID = "seasons";

/** Seasons with per-episode "watched" checkboxes and overall progress. */
export function EpisodeTracker({ show, seasons }: Props) {
  const progress = useShowProgress(show.key);
  const summary = progressSummary(progress ? { ...progress, seasons } : null);
  const next = progress ? nextEpisode({ ...progress, seasons }) : null;
  if (seasons.length === 0) return null;

  return (
    <section
      id={EPISODES_SECTION_ID}
      aria-labelledby="episodes-heading"
      className="scroll-mt-24 space-y-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="episodes-heading"
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <ListChecks className="size-5" aria-hidden />
          Seasons & episodes
        </h2>
        {summary.watched > 0 && (
          <p className="text-sm text-muted-foreground">
            {summary.watched}/{summary.total} episodes watched
            {next && (
              <>
                {" "}
                · Up next:{" "}
                <span className="font-medium text-foreground">{formatEpisodeRef(next)}</span>
              </>
            )}
          </p>
        )}
      </div>
      {summary.total > 0 && (
        <ProgressBar
          percent={summary.percent}
          label={`${show.title}: ${summary.percent}% watched`}
        />
      )}
      <ul className="divide-y rounded-lg border">
        {seasons.map((season) => (
          <li key={season.number}>
            <SeasonRow show={show} seasons={seasons} season={season} progress={progress} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SeasonRow({
  show,
  seasons,
  season,
  progress,
}: {
  readonly show: ShowRef;
  readonly seasons: ReadonlyArray<SeasonInfo>;
  readonly season: TrackerSeason;
  readonly progress: ShowProgress | null;
}) {
  const panelId = useId();
  const format = useFormatters();
  const queryClient = useQueryClient();
  const { setSeason } = useEpisodeActions();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const watched = watchedInSeason(progress, season.number);
  const complete = season.episodeCount > 0 && watched >= season.episodeCount;
  const isSpecials = season.number === SPECIALS_SEASON;

  const markSeason = async () => {
    setBusy(true);
    try {
      const episodes = await queryClient.fetchQuery({
        queryKey: seasonKeys.season(show.id, season.number),
        queryFn: async () =>
          parseSeasonEpisodes(await tmdbProxyGet(`tv/${show.id}/season/${season.number}`)),
      });
      const today = todayIso();
      const aired = episodes.filter((episode) => hasAired(episode, today));
      setSeason(show, seasons, season.number, aired, !complete);
      toast(complete ? `${season.name} unmarked` : `${season.name} marked as watched`, {
        description: show.title,
      });
    } catch {
      toast.error("Couldn't load this season's episodes. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 p-2 sm:p-3">
        <MediaPoster
          path={season.posterPath}
          title={`${show.title}, ${season.name}`}
          size="w92"
          decorative
          sizes="40px"
          className="w-10 shrink-0"
        />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{season.name}</span>
            <span className="block text-xs text-muted-foreground">
              {[format.year(season.airDate), pluralize(season.episodeCount, "episode")]
                .filter(Boolean)
                .join(" · ")}
              {!isSpecials && watched > 0 && ` · ${watched} watched`}
            </span>
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {season.episodeCount > 0 && (
          <Button
            variant={complete ? "secondary" : "outline"}
            size="sm"
            onClick={() => void markSeason()}
            disabled={busy}
            aria-label={complete ? `Unmark ${season.name}` : `Mark ${season.name} as watched`}
            className="shrink-0"
          >
            {busy ? (
              <Spinner className="size-4" label="Updating" />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            <span className="hidden sm:inline">{complete ? "Watched" : "Mark watched"}</span>
          </Button>
        )}
      </div>
      {open && (
        <div id={panelId} className="border-t bg-muted/30 p-2 sm:p-3">
          <EpisodeList show={show} seasons={seasons} season={season.number} progress={progress} />
        </div>
      )}
    </div>
  );
}

function EpisodeList({
  show,
  seasons,
  season,
  progress,
}: {
  readonly show: ShowRef;
  readonly seasons: ReadonlyArray<SeasonInfo>;
  readonly season: number;
  readonly progress: ShowProgress | null;
}) {
  const format = useFormatters();
  const { toggle } = useEpisodeActions();
  const query = useSeasonEpisodes(show.id, season, true);
  const today = todayIso();

  if (query.isPending) {
    return (
      <div className="flex justify-center py-4">
        <Spinner label="Loading episodes" />
      </div>
    );
  }
  if (query.isError) {
    return <p className="py-3 text-sm text-muted-foreground">Couldn&apos;t load episodes.</p>;
  }
  if (query.data.length === 0) {
    return (
      <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Tv className="size-4" aria-hidden /> No episodes listed yet.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {query.data.map((episode) => {
        const ref = { season, episode: episode.number };
        const checked = isEpisodeWatched(progress, ref);
        const aired = hasAired(episode, today);
        return (
          <li key={episode.number}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-accent",
                !aired && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!aired}
                onChange={() => toggle(show, seasons, ref, episode.runtimeMinutes)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {episode.number}. {episode.name || `Episode ${episode.number}`}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {[
                    aired
                      ? format.date(episode.airDate)
                      : episode.airDate
                        ? `Airs ${format.date(episode.airDate)}`
                        : "Not aired yet",
                    format.runtime(episode.runtimeMinutes),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
