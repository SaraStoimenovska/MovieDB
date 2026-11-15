"use client";

import { RotateCcw, Tag, X } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  type CatalogFilters as Filters,
  DEFAULT_FILTERS,
  hasActiveFilters,
  isSortKey,
  SORT_KEYS,
  SORT_LABELS,
  updateFilters,
  yearOptions,
} from "../model/filters";
import { type Genre } from "../model/genres";

/** Radix Select can't hold an empty value, so "no filter" is an explicit sentinel. */
const ANY = "any";

/** Full width in the 2-column phone grid, fixed widths in the desktop row. */
const TRIGGER = "w-full sm:w-auto";

type Props = {
  readonly filters: Filters;
  readonly genres: ReadonlyArray<Genre>;
  readonly keywordName: string | null;
  readonly maxYear: number;
  readonly onChange: (filters: Filters) => void;
};

const toNullableNumber = (value: string): number | null => (value === ANY ? null : Number(value));

export function CatalogFilters({ filters, genres, keywordName, maxYear, onChange }: Props) {
  const years = useMemo(() => yearOptions(maxYear), [maxYear]);

  return (
    <div
      className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap sm:gap-3"
      role="group"
      aria-label="Filters"
    >
      <Select
        value={filters.sort}
        onValueChange={(value) =>
          isSortKey(value) && onChange(updateFilters(filters, { sort: value }))
        }
      >
        <SelectTrigger className={`${TRIGGER} sm:w-40`} aria-label="Sort by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {SORT_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.genreId === null ? ANY : String(filters.genreId)}
        onValueChange={(value) =>
          onChange(updateFilters(filters, { genreId: toNullableNumber(value) }))
        }
      >
        <SelectTrigger className={`${TRIGGER} sm:w-44`} aria-label="Genre">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All genres</SelectItem>
          {genres.map((genre) => (
            <SelectItem key={genre.id} value={String(genre.id)}>
              {genre.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.year === null ? ANY : String(filters.year)}
        onValueChange={(value) =>
          onChange(updateFilters(filters, { year: toNullableNumber(value) }))
        }
      >
        <SelectTrigger className={`${TRIGGER} sm:w-32`} aria-label="Year">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ANY}>Any year</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters(filters) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="justify-self-start"
        >
          <RotateCcw className="size-4" aria-hidden />
          Reset
        </Button>
      )}

      {filters.keywordId !== null && (
        <Badge variant="secondary" className="col-span-2 h-8 w-fit gap-1.5 pr-1 text-sm">
          <Tag className="size-3.5" aria-hidden />
          {keywordName ?? "Keyword"}
          <button
            type="button"
            onClick={() => onChange(updateFilters(filters, { keywordId: null }))}
            aria-label={`Remove keyword filter ${keywordName ?? ""}`.trim()}
            className="rounded-full p-0.5 hover:bg-background"
          >
            <X className="size-3.5" />
          </button>
        </Badge>
      )}
    </div>
  );
}
