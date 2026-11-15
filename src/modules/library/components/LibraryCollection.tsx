"use client";

import { SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { MediaGrid } from "@/modules/media";
import { LibraryView, useDisplayName, useLibraryView } from "@/modules/preferences";
import { ShareListButton, sharedListName } from "@/modules/sharing";
import { APP_LOCALE } from "@/shared/config/app";
import { Button } from "@/shared/ui/button";
import { type LibraryEntry, snapshotToSummary } from "../model/library";
import {
  type AddedAt,
  applyListQuery,
  DEFAULT_LIST_QUERY,
  genreOptions,
  isDefaultQuery,
  type ListQuery,
} from "../model/list-tools";
import { LibraryListRow } from "./LibraryListRow";
import { LibraryToolbar } from "./LibraryToolbar";

type Props = {
  readonly entries: ReadonlyArray<LibraryEntry>;
  readonly addedAt: AddedAt;
  /** Genre id → name (from TMDB, rendered on the server). */
  readonly genreNames: Readonly<Record<number, string>>;
  /** Name of this list, e.g. "Favorites" (used for the shared link: "Sara's favorites"). */
  readonly listLabel: string;
};

/** Sort / filter / grid-or-list for a set of library entries (Favorites, My list tabs). */
export function LibraryCollection({ entries, addedAt, genreNames, listLabel }: Props) {
  const [query, setQuery] = useState<ListQuery>(DEFAULT_LIST_QUERY);
  const { view, setView } = useLibraryView();
  const { displayName } = useDisplayName();

  const visible = useMemo(
    () => applyListQuery(entries, query, addedAt, APP_LOCALE),
    [entries, query, addedAt],
  );
  const genres = useMemo(
    () => genreOptions(entries, query.type, genreNames),
    [entries, query.type, genreNames],
  );
  const summaries = useMemo(
    () => visible.map((entry) => snapshotToSummary(entry.media)),
    [visible],
  );

  return (
    <div className="space-y-4">
      <LibraryToolbar
        query={query}
        onQueryChange={setQuery}
        genres={genres}
        view={view}
        onViewChange={setView}
        // Shares exactly what's shown: current filters and order.
        actions={
          <ShareListButton
            name={sharedListName(displayName, listLabel)}
            keys={visible.map((entry) => entry.media.key)}
          />
        }
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {visible.length === entries.length
          ? `${entries.length} title${entries.length === 1 ? "" : "s"}`
          : `${visible.length} of ${entries.length} titles`}
      </p>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">No titles match these filters.</p>
          {!isDefaultQuery(query) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery({ ...DEFAULT_LIST_QUERY, sort: query.sort })}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : view === LibraryView.List ? (
        <ul className="space-y-2">
          {visible.map((entry) => (
            <li key={entry.media.key}>
              <LibraryListRow entry={entry} addedAt={addedAt(entry)} />
            </li>
          ))}
        </ul>
      ) : (
        <MediaGrid items={summaries} showType />
      )}
    </div>
  );
}
