"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { MediaPoster } from "@/modules/media";
import { routes } from "@/shared/config/routes";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { PageSpinner, Spinner } from "@/shared/ui/spinner";
import { useUpcoming } from "../hooks/useUpcoming";
import {
  daysBetween,
  toIsoDay,
  UPCOMING_GROUP_LABELS,
  UPCOMING_KIND_LABELS,
  type UpcomingItem,
  UpcomingKind,
} from "../model/upcoming";

/** Releases and next episodes from your list, soonest first, grouped by week / month / later. */
export function UpcomingView() {
  const { ready, loading, failed, sections } = useUpcoming();

  if (!ready) return <PageSpinner label="Loading your list" />;

  return (
    <div className="space-y-8">
      {loading && <Spinner label="Checking your series for new episodes" />}
      {failed > 0 && (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t check {failed} series right now; they&apos;ll be retried next time.
        </p>
      )}

      {sections.length === 0 && !loading ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <CalendarClock className="size-6 text-muted-foreground" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold">Nothing coming up</h2>
          <p className="text-muted-foreground">
            Add upcoming movies to your list, or follow series you watch, and their release dates
            and next episodes show up here.
          </p>
          <Button asChild className="mt-2">
            <Link href={routes.home()}>See what&apos;s coming soon</Link>
          </Button>
        </div>
      ) : (
        sections.map((section) => (
          <section
            key={section.group}
            aria-labelledby={`upcoming-${section.group}`}
            className="space-y-3"
          >
            <h2 id={`upcoming-${section.group}`} className="text-xl font-semibold tracking-tight">
              {UPCOMING_GROUP_LABELS[section.group]}
            </h2>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={`${item.media.key}:${item.kind}`}>
                  <UpcomingRow item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function UpcomingRow({ item }: { readonly item: UpcomingItem }) {
  const format = useFormatters();
  const days = daysBetween(toIsoDay(new Date()), item.date);
  const when = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;

  return (
    <Link
      href={routes.media(item.media.mediaType, item.media.id)}
      className="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:gap-4"
    >
      <div className="w-16 shrink-0 text-center sm:w-20">
        <p className="text-xs text-muted-foreground uppercase">
          {format.date(item.date, { weekday: "short" })}
        </p>
        <p className="text-lg leading-tight font-semibold">
          {format.date(item.date, { day: "numeric", month: "short" })}
        </p>
      </div>
      <MediaPoster
        path={item.media.posterPath}
        title={item.media.title}
        size="w92"
        sizes="40px"
        decorative
        className="w-10 shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium">{item.media.title}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {UPCOMING_KIND_LABELS[item.kind]}
          </Badge>
          {item.kind === UpcomingKind.Episode && item.episode && (
            <span>
              S{item.episode.season} E{item.episode.episode}
              {item.episode.name && ` · ${item.episode.name}`}
            </span>
          )}
          <span>{when}</span>
        </p>
      </div>
    </Link>
  );
}
