"use client";

import Link from "next/link";
import { useState } from "react";
import { MediaPoster } from "@/modules/media";
import { APP_LOCALE } from "@/shared/config/app";
import { routes } from "@/shared/config/routes";
import { MEDIA_TYPE_LABELS } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { formatYear } from "@/shared/utils/format";
import { type Credit, CreditTab, isCreditTab } from "../model/person";

/** Rows shown before "Show all": a long career would otherwise be a wall of text. */
const INITIAL_ROWS = 20;

type Props = {
  readonly acting: ReadonlyArray<Credit>;
  readonly crew: ReadonlyArray<Credit>;
  readonly defaultTab: CreditTab;
};

export function Filmography({ acting, crew, defaultTab }: Props) {
  const [tab, setTab] = useState<CreditTab>(defaultTab);
  const lists: Readonly<Record<CreditTab, ReadonlyArray<Credit>>> = {
    [CreditTab.Acting]: acting,
    [CreditTab.Crew]: crew,
  };
  const available = [CreditTab.Acting, CreditTab.Crew].filter((key) => lists[key].length > 0);
  if (available.length === 0) return null;

  return (
    <section aria-labelledby="filmography-heading" className="space-y-4">
      <h2 id="filmography-heading" className="text-xl font-semibold tracking-tight">
        Filmography
      </h2>
      <Tabs
        value={tab}
        onValueChange={(value) => isCreditTab(value) && setTab(value)}
        className="gap-4"
      >
        <TabsList>
          {available.map((key) => (
            <TabsTrigger key={key} value={key} className="px-4">
              {key === CreditTab.Acting ? "Acting" : "Crew"}
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                {lists[key].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {available.map((key) => (
          <TabsContent key={key} value={key}>
            <CreditList credits={lists[key]} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function CreditList({ credits }: { readonly credits: ReadonlyArray<Credit> }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? credits : credits.slice(0, INITIAL_ROWS);

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-lg border">
        {visible.map(({ media, role }) => (
          <li key={media.key}>
            <Link
              href={routes.media(media.mediaType, media.id)}
              className="flex items-center gap-3 p-2 transition-colors hover:bg-accent sm:gap-4 sm:p-3"
            >
              <span className="w-10 shrink-0 text-sm text-muted-foreground tabular-nums">
                {formatYear(media.releaseDate, APP_LOCALE) || "—"}
              </span>
              <MediaPoster
                path={media.posterPath}
                title={media.title}
                size="w92"
                decorative
                sizes="40px"
                className="w-10 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{media.title}</span>
                {role && (
                  <span className="block truncate text-sm text-muted-foreground">{role}</span>
                )}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {MEDIA_TYPE_LABELS[media.mediaType]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {credits.length > INITIAL_ROWS && (
        <Button
          variant="outline"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
        >
          {showAll ? "Show fewer" : `Show all ${credits.length}`}
        </Button>
      )}
    </div>
  );
}
