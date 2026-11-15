"use client";

import { useMemo } from "react";
import { APP_LOCALE } from "@/shared/config/app";
import {
  type DateInput,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatDuration,
  formatLanguage,
  formatRegion,
  formatRating,
  formatRelativeTime,
  formatRuntime,
  formatYear,
} from "@/shared/utils/format";

/**
 * The formatting hook for client components: every formatter bound to the current locale.
 * The pure functions live in `@/shared/utils/format` (also usable on the server with
 * APP_LOCALE); this hook only binds the locale, so a user-selected locale later is one change.
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
      language: (code: string | null | undefined) => formatLanguage(code, locale),
      region: (code: string | null | undefined) => formatRegion(code, locale),
      duration: (minutes: number) => formatDuration(minutes, locale),
    }),
    [locale],
  );
