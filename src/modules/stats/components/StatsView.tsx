"use client";

import {
  BarChart3,
  Bookmark,
  Clapperboard,
  Clock,
  Heart,
  type LucideIcon,
  MessageSquareText,
  NotebookPen,
  Star,
  Tv,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { selectEpisodeTotals, useEpisodesData } from "@/modules/episodes";
import { useLibraryData } from "@/modules/library";
import { MediaGrid } from "@/modules/media";
import { useNotesCount } from "@/modules/notes";
import { useReviewsCount } from "@/modules/reviews";
import { RATING_SCALE } from "@/shared/config/rating";
import { routes } from "@/shared/config/routes";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { Button } from "@/shared/ui/button";
import { PageSpinner } from "@/shared/ui/spinner";
import { computeStats, isEmptyStats, type Stats } from "../model/stats";

type Props = { readonly genreNames: Readonly<Record<number, string>> };

export function StatsView({ genreNames }: Props) {
  const { data: library, ready } = useLibraryData();
  const { data: episodes } = useEpisodesData();
  const reviews = useReviewsCount();
  const notes = useNotesCount();

  const stats = useMemo(
    () =>
      computeStats(
        { library, episodes: selectEpisodeTotals(episodes), reviews, notes },
        genreNames,
      ),
    [library, episodes, reviews, notes, genreNames],
  );

  if (!ready) return <PageSpinner label="Crunching your stats" />;

  if (isEmptyStats(stats)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <BarChart3 className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">No stats yet</p>
        <p className="text-muted-foreground">
          Favorite, rate and mark titles as watched (and track episodes) to see your stats here.
        </p>
        <Button asChild>
          <Link href={routes.browse()}>Browse titles</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <Overview stats={stats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RatingsChart stats={stats} />
        <GenresChart stats={stats} />
      </div>
      {stats.recentlyWatched.length > 0 && (
        <section aria-labelledby="recent-heading" className="space-y-4">
          <h2 id="recent-heading" className="text-xl font-semibold tracking-tight">
            Recently watched
          </h2>
          <MediaGrid items={stats.recentlyWatched} showType />
        </section>
      )}
    </div>
  );
}

function Overview({ stats }: { readonly stats: Stats }) {
  const format = useFormatters();
  const cards: ReadonlyArray<{ icon: LucideIcon; label: string; value: string; hint?: string }> = [
    {
      icon: Clock,
      label: "Time watched",
      value: format.duration(stats.minutesWatched),
      hint:
        stats.moviesWithoutRuntime > 0
          ? `${stats.moviesWithoutRuntime} movie(s) without a known runtime not counted`
          : undefined,
    },
    { icon: Clapperboard, label: "Movies watched", value: String(stats.watchedMovies) },
    { icon: Tv, label: "Series watched", value: String(stats.watchedSeries) },
    { icon: Tv, label: "Episodes watched", value: String(stats.episodesWatched) },
    { icon: Heart, label: "Favorites", value: String(stats.favorites) },
    { icon: Bookmark, label: "Want to watch", value: String(stats.toWatch) },
    {
      icon: Star,
      label: "Average rating",
      value:
        stats.averageRating === null
          ? "–"
          : `${format.rating(stats.averageRating)}/${RATING_SCALE.max}`,
      hint: stats.ratedCount > 0 ? `${stats.ratedCount} rated` : undefined,
    },
    { icon: MessageSquareText, label: "Reviews written", value: String(stats.reviews) },
    { icon: NotebookPen, label: "Notes", value: String(stats.notes) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(({ icon: Icon, label, value, hint }) => (
        <div key={label} className="rounded-xl border p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{value}</dd>
          {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Horizontal bar list: label · bar · count. Accessible as a plain list of values. */
function BarList({
  title,
  rows,
  empty,
}: {
  readonly title: string;
  readonly rows: ReadonlyArray<{ readonly label: string; readonly value: number }>;
  readonly empty: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  const id = `${title.toLowerCase().replace(/\W+/g, "-")}-heading`;
  return (
    <section aria-labelledby={id} className="space-y-4 rounded-xl border p-4 sm:p-6">
      <h2 id={id} className="font-semibold">
        {title}
      </h2>
      {rows.every((row) => row.value === 0) ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.label}
              className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-sm"
            >
              <span className="truncate text-muted-foreground">{row.label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${(row.value / max) * 100}%` }}
                />
              </span>
              <span className="text-right tabular-nums">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RatingsChart({ stats }: { readonly stats: Stats }) {
  const rows = stats.ratingDistribution
    .map((value, index) => ({ label: `${RATING_SCALE.min + index} ★`, value }))
    .toReversed();
  return (
    <BarList title="Your ratings" rows={rows} empty="Rate titles on their pages to see this." />
  );
}

function GenresChart({ stats }: { readonly stats: Stats }) {
  const rows = stats.topGenres.map((genre) => ({ label: genre.name, value: genre.count }));
  return (
    <BarList title="Top genres (watched)" rows={rows} empty="Mark titles as watched to see this." />
  );
}
