"use client";

import { Bookmark, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { MediaGrid } from "@/modules/media";
import { PageSpinner } from "@/shared/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useLibraryData } from "../hooks/useLibrary";
import {
  selectByStatus,
  selectCounts,
  WATCH_STATUS_LABELS,
  WATCH_STATUSES,
  type WatchStatus,
} from "../model/library";
import { LibraryEmptyState } from "./LibraryEmptyState";

const EMPTY_COPY: Readonly<
  Record<WatchStatus, { readonly title: string; readonly description: string }>
> = {
  to_watch: {
    title: "Nothing to watch yet",
    description: "Use the bookmark on any title and pick “Want to watch” to plan what's next.",
  },
  watched: {
    title: "Nothing watched yet",
    description: "Mark titles as “Watched” to keep a history of everything you've seen.",
  },
};

export function MyListView() {
  const { data, ready } = useLibraryData();
  const [tab, setTab] = useState<WatchStatus>("to_watch");
  const counts = useMemo(() => selectCounts(data), [data]);
  const items = useMemo(() => selectByStatus(data, tab).map((entry) => entry.media), [data, tab]);

  if (!ready) return <PageSpinner label="Loading your list" />;

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as WatchStatus)} className="gap-6">
      <TabsList aria-label="List">
        {WATCH_STATUSES.map((status) => (
          <TabsTrigger key={status} value={status} className="gap-2 px-4">
            {status === "watched" ? <Eye className="size-4" /> : <Bookmark className="size-4" />}
            {WATCH_STATUS_LABELS[status]}
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
              {counts[status]}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={tab}>
        {items.length === 0 ? (
          <LibraryEmptyState icon={tab === "watched" ? Eye : Bookmark} {...EMPTY_COPY[tab]} />
        ) : (
          <MediaGrid items={items} showType />
        )}
      </TabsContent>
    </Tabs>
  );
}
