"use client";

import { useMemo } from "react";
import { APP_LOCALE } from "@/shared/config/app";
import {
  type DateInput,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatRating,
  formatRelativeTime,
  formatRuntime,
  formatYear,
} from "@/shared/utils/format";

/**
 * Locale-bound formatters for client components.
 * The pure functions live in `@/shared/utils/format`; this hook only binds the locale,
 * so swapping in a user-selected locale later is a single change.
 */
export const useFormatters = (locale: string = APP_LOCALE) =>
  useMemo(
    () => ({
      date: (input: DateInput | null | undefined, options?: Intl.DateTimeFormatOptions) =>
        formatDate(input, locale, options),
      year: (input: DateInput | null | undefined) => formatYear(input, locale),
      relativeTime: (input: DateInput, now?: DateInput) => formatRelativeTime(input, locale, now),
      runtime: (minutes: number | null | undefined) => formatRuntime(minutes, locale),
      rating: (value: number | null | undefined) => formatRating(value, locale),
      compactNumber: (value: number | null | undefined) => formatCompactNumber(value, locale),
      currency: (value: number | null | undefined, currency?: string) =>
        formatCurrency(value, locale, currency),
    }),
    [locale],
  );

export type Formatters = ReturnType<typeof useFormatters>;

/** Convenience single-purpose hooks, for components that need just one formatter. */
export const useFormatDate = () => useFormatters().date;
export const useRelativeTime = () => useFormatters().relativeTime;
export const useFormatRuntime = () => useFormatters().runtime;
export const useFormatRating = () => useFormatters().rating;
export const useFormatNumber = () => useFormatters().compactNumber;
export const useFormatCurrency = () => useFormatters().currency;
