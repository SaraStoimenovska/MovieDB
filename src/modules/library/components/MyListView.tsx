"use client";

import { useMemo, useState } from "react";
import { PageSpinner } from "@/shared/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useLibraryData } from "../hooks/useLibrary";
import {
  type LibraryEntry,
  selectByStatus,
  selectCounts,
  WATCH_STATUS_LABELS,
  WATCH_STATUSES,
  WatchStatus,
} from "../model/library";
import { LibraryCollection } from "./LibraryCollection";
import { LibraryEmptyState } from "./LibraryEmptyState";
import { WATCH_STATUS_ICONS } from "./status-icons";

const EMPTY_COPY: Readonly<
  Record<WatchStatus, { readonly title: string; readonly description: string }>
> = {
  [WatchStatus.ToWatch]: {
    title: "Nothing to watch yet",
    description: "Use the bookmark on any title and pick “Want to watch” to plan what's next.",
  },
  [WatchStatus.Watched]: {
    title: "Nothing watched yet",
    description: "Mark titles as “Watched” to keep a history of everything you've seen.",
  },
};

const DEFAULT_TAB: WatchStatus = WatchStatus.ToWatch;

const isWatchStatus = (value: string): value is WatchStatus =>
  (WATCH_STATUSES as ReadonlyArray<string>).includes(value);

const statusAt = (entry: LibraryEntry) => entry.statusAt;

type Props = { readonly genreNames: Readonly<Record<number, string>> };

export function MyListView({ genreNames }: Props) {
  const { data, ready } = useLibraryData();
  const [tab, setTab] = useState<WatchStatus>(DEFAULT_TAB);
  const counts = useMemo(() => selectCounts(data), [data]);
  const entries = useMemo(() => selectByStatus(data, tab), [data, tab]);

  if (!ready) return <PageSpinner label="Loading your list" />;

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => isWatchStatus(value) && setTab(value)}
      className="gap-6"
    >
      <TabsList aria-label="List" className="w-full sm:w-auto">
        {WATCH_STATUSES.map((status) => {
          const Icon = WATCH_STATUS_ICONS[status];
          return (
            <TabsTrigger
              key={status}
              value={status}
              className="flex-1 gap-2 px-3 sm:flex-none sm:px-4"
            >
              <Icon className="size-4" />
              {WATCH_STATUS_LABELS[status]}
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                {counts[status]}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      <TabsContent value={tab}>
        {entries.length === 0 ? (
          <LibraryEmptyState icon={WATCH_STATUS_ICONS[tab]} {...EMPTY_COPY[tab]} />
        ) : (
          // Keyed by tab: each list starts with fresh sort/filters.
          <LibraryCollection
            key={tab}
            entries={entries}
            addedAt={statusAt}
            genreNames={genreNames}
            listLabel={WATCH_STATUS_LABELS[tab]}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
