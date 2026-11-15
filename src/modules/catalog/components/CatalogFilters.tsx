"use client";

import { RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  type CatalogFilters as Filters,
  DEFAULT_FILTERS,
  SORT_KEYS,
  SORT_LABELS,
  type SortKey,
  updateFilters,
  yearOptions,
} from "../model/filters";
import { type Genre } from "../model/genres";

/** Radix Select can't hold an empty value, so "no filter" is an explicit sentinel. */
const ANY = "any";

type Props = {
  readonly filters: Filters;
  readonly genres: ReadonlyArray<Genre>;
  readonly onChange: (filters: Filters) => void;
};

const toNullableNumber = (value: string): number | null => (value === ANY ? null : Number(value));

export function CatalogFilters({ filters, genres, onChange }: Props) {
  const years = useMemo(() => yearOptions(new Date().getFullYear() + 1), []);
  const isDefault =
    filters.sort === DEFAULT_FILTERS.sort && filters.genreId === null && filters.year === null;

  return (
    <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filters">
      <Select
        value={filters.sort}
        onValueChange={(value) => onChange(updateFilters(filters, { sort: value as SortKey }))}
      >
        <SelectTrigger className="w-40" aria-label="Sort by">
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
        <SelectTrigger className="w-44" aria-label="Genre">
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
        <SelectTrigger className="w-32" aria-label="Year">
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

      {!isDefault && (
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
          <RotateCcw className="size-4" aria-hidden />
          Reset
        </Button>
      )}
    </div>
  );
}
