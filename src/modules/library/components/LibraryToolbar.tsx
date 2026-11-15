"use client";

import { LayoutGrid, List } from "lucide-react";
import { LibraryView } from "@/modules/preferences";
import { MEDIA_TYPE_LABELS, MediaType } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  ALL_TYPES,
  type GenreOption,
  isLibrarySort,
  LIBRARY_SORT_LABELS,
  LIBRARY_SORTS,
  type ListQuery,
  type TypeFilter,
} from "../model/list-tools";

/** Select values must be strings: "all" stands for "no genre filter". */
const ALL_GENRES = "all";

const TYPE_OPTIONS: ReadonlyArray<{ readonly value: TypeFilter; readonly label: string }> = [
  { value: ALL_TYPES, label: "Movies & series" },
  { value: MediaType.Movie, label: MEDIA_TYPE_LABELS[MediaType.Movie] },
  { value: MediaType.Tv, label: MEDIA_TYPE_LABELS[MediaType.Tv] },
];

const isTypeFilter = (value: string): value is TypeFilter =>
  TYPE_OPTIONS.some((option) => option.value === value);

type Props = {
  readonly query: ListQuery;
  readonly onQueryChange: (query: ListQuery) => void;
  readonly genres: ReadonlyArray<GenreOption>;
  readonly view: LibraryView;
  readonly onViewChange: (view: LibraryView) => void;
  /** Extra controls on the right (e.g. Share). */
  readonly actions?: React.ReactNode;
};

const VIEW_BUTTONS = [
  { view: LibraryView.Grid, label: "Grid view", Icon: LayoutGrid },
  { view: LibraryView.List, label: "List view", Icon: List },
] as const;

export function LibraryToolbar({
  query,
  onQueryChange,
  genres,
  view,
  onViewChange,
  actions,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={query.sort}
        onValueChange={(value) => isLibrarySort(value) && onQueryChange({ ...query, sort: value })}
      >
        <SelectTrigger size="sm" aria-label="Sort by" className="min-w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LIBRARY_SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {LIBRARY_SORT_LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={query.type}
        // A genre may not exist for the other type: reset it when the type changes.
        onValueChange={(value) =>
          isTypeFilter(value) && onQueryChange({ ...query, type: value, genreId: null })
        }
      >
        <SelectTrigger size="sm" aria-label="Type" className="min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {genres.length > 0 && (
        <Select
          value={query.genreId === null ? ALL_GENRES : String(query.genreId)}
          onValueChange={(value) =>
            onQueryChange({ ...query, genreId: value === ALL_GENRES ? null : Number(value) })
          }
        >
          <SelectTrigger size="sm" aria-label="Genre" className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GENRES}>All genres</SelectItem>
            {genres.map((genre) => (
              <SelectItem key={genre.id} value={String(genre.id)}>
                {genre.name} ({genre.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="ml-auto flex items-center gap-2">
        {actions}
        <div className="flex rounded-md border p-0.5" role="group" aria-label="Layout">
          {VIEW_BUTTONS.map(({ view: option, label, Icon }) => (
            <Button
              key={option}
              type="button"
              variant={view === option ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              aria-label={label}
              aria-pressed={view === option}
              title={label}
              onClick={() => onViewChange(option)}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
